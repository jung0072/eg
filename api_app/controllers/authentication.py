import string
import requests
from datetime import timedelta, datetime
from cities_light.models import City
from django.contrib import auth
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db.models import Q
from django.db import transaction, IntegrityError
from config.config_provider import ConfigProvider
from django.shortcuts import render, redirect
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import exceptions

from django.shortcuts import reverse
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator

from django.http import JsonResponse, Http404
from django.core.exceptions import PermissionDenied
from config import settings
from auth_app.models import UserProfile, UserProfileQuestion, UserProfileAnswer, UserProfileOption
from auth_app.utils.constants import ACCOUNT_CREATED_SUCCESSFULLY, EDI_SECTION_ID, EDITypes, PLATFORMS
from auth_app.views.serializers.user_serializer import UserProfileRegistrationSerializer, UserProfileSerializer, \
    CitySerializer
from api_app.utils import remove_leading_trailing_whitespace, match_edi_values_from_insight_scope, format_timedelta
from engage_app.utils import EngageViews
from communication_app.models import Notification
from communication_app.utils import NotificationTypes
from engage_app.models import ResearchProject
from api_app.utils.permissions import RequirePasswordResetToken
from engage_app.models.research_project.research_project_task import ResearchProjectTask
from api_app.serializers import ErrorSerializer, SuccessSerializer
from api_app.utils.errorcodes import *
from auth_app.forms.authentication import CustomPasswordResetConfirmForm
from email_app.utils import EngageEmail, EmailTemplateConstants
from auth_app.utils.common import *
from communication_app.models import SystemMessage
from api_app.utils.throttles import ResendActivationEmailThrottle


def home(request):
    """Return the base template for the React Application home page"""
    return render(request, 'react/base.html')


def faq_question(request, question_id):
    return render(request, 'react/base.html')


def system_message(request, message_id):
    """Return the base template for the React Application system message page"""
    requested_message = SystemMessage.objects.filter(id=message_id)
    if requested_message.exists():
        return render(request, 'react/base.html')
    raise SystemMessage.DoesNotExist("The request system message page does not exist")


def react_app_user_page(request, user_id):
    """Check if the request user page exists and if they do you can render the react application"""
    requested_user = User.objects.filter(id=user_id)
    if requested_user.exists():
        return render(request, 'react/base.html')
    else:
        raise Http404("The requested user page does not exist.")


def react_app_research_project_page(request, research_project_id):
    """Check if the request project page exists and if they do you can render the react application"""
    requested_project = ResearchProject.objects.filter(id=research_project_id)
    if requested_project.exists():
        return render(request, 'react/base.html')
    else:
        raise Http404("Sorry, the project page you are looking for cannot be found.")


def react_app_research_project_task_page(request, research_project_task_id):
    """Check if the request task page exists and if they do you can render the react application"""
    requested_task = ResearchProjectTask.objects.filter(id=research_project_task_id)
    if requested_task.exists():
        return render(request, 'react/base.html')
    else:
        raise Http404("Sorry, the task page you are looking for cannot be found.")


def react_app_research_project_form(request, research_project_id=None):
    if research_project_id:
        requested_project = ResearchProject.objects.filter(id=research_project_id)
        if requested_project.exists():
            return render(request, 'react/base.html')
        else:
            raise Http404("Sorry, the project page you are looking for cannot be found.")
    else:
        return render(request, 'react/base.html')


def react_app_platform_signup(request, platform):
    return render(request, 'react/base.html')


def activate_educate_user_account(request, access):
    if request.method == "GET":
        # Check if the access token is null or an empty string before checking to activate an account
        if access is None or access == '':
            return JsonResponse(
                dict(error="This was an invalid request, could not activate account"),
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Change this to token based email activation by querying a randomized token from the user profile
        user_account = get_user_from_access_token(access)
        if not user_account.exists():
            return JsonResponse(
                dict(error="This was an invalid request, could not activate account"),
                status=status.HTTP_400_BAD_REQUEST
            )

        # check if the user is active or not and send them to the appropriate screen
        user_account = user_account.first()
        if not user_account.is_active:
            return redirect(f'{settings.EDUCATE_SERVER}/activated/?should_activate_account=true&token={access}')
        return redirect(f'{settings.EDUCATE_SERVER}/activated/?should_activate_account=false')

    else:
        return JsonResponse(
            data=dict(error="This is an invalid request, please try again later..."), status=status.HTTP_400_BAD_REQUEST
        )


class RegistrationViewAPI(APIView):

    def post(self, request):
        # normalize the emails and the username from the address by setting to lowercase
        request.data['user']["username"] = remove_leading_trailing_whitespace(
            request.data['user'].get("username").lower()
        )
        request.data['user']["email"] = remove_leading_trailing_whitespace(request.data['user'].get("email").lower())
        request.data['user']["first_name"] = remove_leading_trailing_whitespace(request.data['user'].get("first_name"))
        request.data['user']["last_name"] = remove_leading_trailing_whitespace(request.data['user'].get("last_name"))

        user_serializer = UserProfileRegistrationSerializer(data=request.data, context={'platform': PLATFORMS.ENGAGE.value})
        if user_serializer.is_valid():
            user_serializer.create(validated_data=request.data)
            serialized_response = SuccessSerializer(dict(success=ACCOUNT_CREATED_SUCCESSFULLY))
            Notification.objects.create(
                receiver_id=User.objects.filter(username=user_serializer.data.get('user')['username']).first().id,
                content=f"Welcome to Engage the Patient Engage Research Platform where patients and families of patients can collaborate with researchers to engage in research studies. Please click on User Menu in the Top Right of the application and go to : Profile > Edit Profile to start filling out your information",
                source_id=User.objects.filter(is_superuser=True).first().id,
                link=f"{reverse('auth_app:edit_user_profile')}",
                type=NotificationTypes.ACCOUNT.value
            )
            return Response(serialized_response.data, content_type="application/json", status=status.HTTP_201_CREATED)
        error_response = ErrorSerializer(dict(error="Could not Register", form_errors=user_serializer.errors))
        return Response(error_response.data, content_type="application/json", status=status.HTTP_409_CONFLICT)


def activate_user_account(request, access):
    if request.method == "GET":
        # Check if the access token is null or an empty string before checking to activate an account
        if access is None or access == '':
            return JsonResponse(
                dict(error="This was an invalid request, could not activate account"),
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Change this to token based email activation by querying a randomized token from the user profile
        user_account = get_user_from_access_token(access)
        if not user_account.exists():
            return JsonResponse(
                dict(error="This was an invalid request, could not activate account"),
                status=status.HTTP_400_BAD_REQUEST
            )

        # check if the user is active or not and send them to the appropriate screen
        user_account = user_account.first()
        if not user_account.is_active:
            return redirect(f'/activated/?should_activate_account=true&token={access}')
        return redirect(f'/activated/?should_activate_account=false')

    else:
        return JsonResponse(
            data=dict(error="This is an invalid request, please try again later..."), status=status.HTTP_400_BAD_REQUEST
        )


class ActivateUserAccountController(APIView):
    def post(self, request):
        # First get the user by the access token and then check if they exist
        user_account = get_user_from_access_token(request.data['access'])
        if not user_account.exists():
            return Response(
                data=ErrorSerializer(dict(error="This user does not exist")).data,
                status=status.HTTP_400_BAD_REQUEST,
                content_type="application/json"
            )

        # Now that we have determined the user exists, check if they are active and send the appropriate response
        user_account = user_account.first()
        if not user_account.is_active:
            user_account.is_active = True
            user_account.save()
            return Response(
                data=SuccessSerializer(dict(success="You have activated your account, please log in")).data,
                status=status.HTTP_200_OK,
                content_type="application/json"
            )

        # The user already activated their account so prompt them to log in
        return Response(
            data=ErrorSerializer(dict(error="This user is already active, please log in")).data,
            status=status.HTTP_400_BAD_REQUEST,
            content_type="application/json"
        )


def get_user_from_access_token(access_token):
    token = AccessToken(access_token)
    payload = token.payload
    return User.objects.filter(email=payload['email'])


def authenticate_user_with_django_session(request):
    # First get the username and password from the request
    username = request.data.get('username', '').lower()
    password = request.data.get('password', '')

    # Try retrieving the user object and check if they are active and check for an error if they do not exist
    try:
        user = User.objects.filter(Q(username=username) | Q(email=username)).first()
        if not user:
            raise ObjectDoesNotExist("Could not find user with username or password")
        if not user.is_active:
            not_active_error = ErrorSerializer(dict(
                error="User is not active",
                form_errors=dict(username=["User not active, please check your email"])
            ))
            return dict(not_active_error.data, status=status.HTTP_400_BAD_REQUEST)
    except ObjectDoesNotExist:
        not_exist_error = ErrorSerializer(dict(
            error="Username/ Email does not exist",
            form_errors=dict(username=["Username/ Email does not exist"])
        ))
        return dict(not_exist_error.data, status=status.HTTP_400_BAD_REQUEST)

    # Authenticate the user using django session backend first, if we do not have a user or they are inactive
    # then return a bad password error
    user = auth.authenticate(username=username, password=password)
    if not (user and user.is_active):
        invalid_password_error = ErrorSerializer(dict(
            error="Invalid password",
            form_errors=dict(password=["Invalid password"])
        ))
        return dict(invalid_password_error.data, status=status.HTTP_400_BAD_REQUEST)

    # Now that the user is logged in, create the login session for the user and then create the JWT access and
    # refresh tokens and return that with the response
    auth.login(request, user)
    redirect_link = request.data.get('next') if request.data.get('next') else None
    return dict(message="Login Successful", redirect_to=f'{redirect_link or "/app/home/"}', status=status.HTTP_200_OK)


class AuthenticateUserTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        """
        Validate the token request and authenticate the user.

        Args:
            attrs (dict): The attributes of the token request.

        Returns:
            dict: The validated token data.

        Raises:
            serializers.ValidationError: If the credentials are invalid.

        """
        custom_response = None
        request = self.context['request']
        platform = self.context.get('platform')

        try:
            # Try to authenticate the user using the username or email
            username_or_email = attrs.get(self.username_field).lower()
            user = User.objects.filter(
                Q(username=username_or_email) | Q(email=username_or_email)
            ).first()

            if user is not None:
                if not user.is_active:
                    raise exceptions.AuthenticationFailed(
                        'This user is not active, please check your emails'
                    )
                # Set the username to the user's username for token generation
                attrs[self.username_field] = user.username
                request.data["username"] = user.username
                attrs['user'] = user
                data = super().validate(attrs)

                if platform == PLATFORMS.ENGAGE.value:
                    # Check if the user is an admin or if they need to fill out their user profile and redirect to the
                    # appropriate Screen file in the front-end
                    if user.is_active and user.is_superuser:
                        # Send admin users directly to the admin panel
                        data['redirect_link'] = "/admin-panel/"
                    elif not user.userprofile.is_minimum_profile_check_valid:
                        # Send users that have not completed their profile to the Edit Profile Page
                        data['redirect_link'] = "/edit_profile/"
                    else:
                        # Send users to the home page
                        data['redirect_link'] = "/home/"
                elif platform == PLATFORMS.EDUCATE.value:
                    data['redirect_link'] = "/home/"

            else:
                raise exceptions.AuthenticationFailed('Invalid credentials, this username or email does not exist')
        except exceptions.AuthenticationFailed as error:
            # Handle authentication failure and get custom response
            custom_response = authenticate_user_with_django_session(request)
            error.detail = custom_response
            raise error
        else:
            # Update the data with the custom response and return
            data.update(dict(response=custom_response))
            return data


class AuthenticateUserTokenObtainPairView(TokenObtainPairView):
    serializer_class = AuthenticateUserTokenObtainPairSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['platform'] = PLATFORMS.ENGAGE.value
        return context


class LogoutUser(APIView):

    def post(self, request):
        token = request.data.get('refresh')

        if token:
            refresh_token = RefreshToken(token)
            refresh_token.blacklist()
        return Response(data={"msg": "User logged out successfully"}, status=status.HTTP_204_NO_CONTENT)


class RetrieveUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # TODO: look at optimizing this view we can limit the user info sent on login
        user_profile = UserProfile.objects.get(user__id=request.id)
        picture = user_profile.get_profile_image()
        is_admin = False

        if request.user.is_superuser and request.user.is_active:
            is_admin = True

        user_profile_info = {
            'id': request.user.id,
            'is_admin': is_admin,
            'full_name': request.user.get_full_name(),
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'is_researcher': user_profile.is_active_researcher,
            'profile_picture': picture,
            'role': user_profile.get_role_label(),
            'active_view': EngageViews.HOME.value,
            'is_profile_complete': user_profile.is_minimum_profile_check_valid,
            'username': user_profile.user.username,
            'email': user_profile.user.email,
            'pronouns': user_profile.pronouns,
            'user_location': user_profile.user_location.id if user_profile.user_location else '',
            'icu_institute': user_profile.icu_institute,
            'is_anonymous': user_profile.is_anonymous,
            'opt_out_project_invitations': user_profile.opt_out_project_invitations,
            'active_projects': user_profile.get_list_of_user_research_projects_info(),
            **user_profile.get_edi_info_dict(),
        }

        serialized_data = UserProfileSerializer(user_profile_info)
        return Response(data={"user": serialized_data.data}, status=status.HTTP_200_OK)


class GetCity(APIView):

    def get(self, request):
        city = City.objects.filter(country_id__name='Canada')

        city_data = CitySerializer(city, many=True)

        return Response(data=city_data.data, status=status.HTTP_200_OK)


def reset_password_confirm(request, uidb64=None, token=None):
    """ render the react page for password reset """
    return render(request, 'react/base.html', {
        'uidb64': uidb64,
        'token': token,
    })


class PasswordResetView(APIView):

    def post(self, request):
        form = PasswordResetForm(request.data)
        if form.is_valid():
            # Get the protocol from the current engage sever name configuration
            config_provider = ConfigProvider()
            engage_server_url = config_provider.get_config('environment', 'server_name')

            # Save the form which will trigger the email being sent
            form.save(
                request=request, html_email_template_name='registration/password_reset_email.html',
                use_https='https' in engage_server_url
            )
            success_response = SuccessSerializer(dict(success=password_reset_email_sent))
            return Response(success_response.data, status=status.HTTP_200_OK)
        else:
            form_error_response = ErrorSerializer(dict(error=general_form_error, form_errors=form.errors))
            return Response(form_error_response.data, status=status.HTTP_400_BAD_REQUEST)


class ConfirmPasswordReset(APIView):
    permission_classes = [RequirePasswordResetToken]

    def post(self, request):
        """This request is to reset password by validating encoded user id and token"""
        reset_password_form = CustomPasswordResetConfirmForm(request.data)

        if reset_password_form.is_valid():
            token = reset_password_form.cleaned_data['token']
            uidb64 = reset_password_form.cleaned_data['encoded_user_id']
            new_password2 = reset_password_form.cleaned_data['new_password2']
            user = decode_user(uidb64)

            if user is not None and default_token_generator.check_token(user, token):
                user.set_password(new_password2)
                user.save()
                auth.update_session_auth_hash(request, user)

                project_params = {
                    'to_users': User.objects.get(id=user.id),
                    'link': settings.SERVER_NAME
                }

                # Email the user that their password reset request was successfully
                email = EngageEmail(
                    subject=f'Engage | {EmailTemplateConstants.PASSWORD_RESET_SUCCESSFULLY}',
                    template_name=EmailTemplateConstants.PASSWORD_RESET_SUCCESSFULLY_TEMPLATE,
                    template_params=project_params
                )
                email.set_recipients(project_params['to_users'].email)
                email.send()

                success_response = SuccessSerializer(dict(success=password_reset_success))
                return Response(success_response.data, status=status.HTTP_200_OK)
            else:
                error_response = ErrorSerializer(dict(error=default_token_generator.check_token(user, token)))
                return Response(error_response.data, status=status.HTTP_401_UNAUTHORIZED)

        else:
            error_form_response = ErrorSerializer(
                dict(error=general_form_error, form_errors=reset_password_form.errors)
            )
            return Response(error_form_response.data, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """This is a request to protect the route"""
        serialized_response = SuccessSerializer(dict(success='success'))
        return Response(serialized_response.data, content_type="application/json", status=status.HTTP_200_OK)


class AuthWithInsightScope(APIView):
    def post(self, request):
        """
            Get the data from the insight scope and update the necessary field on engage user
            profile
        """

        username = request.data.get('username')
        password = request.data.get('password')
        role = request.data.get('role')
        # send a request to insight scope with username and password
        try:
            insight_scope_auth = requests.post(
                    url=f'{settings.INSIGHTSCOPE_SERVER}/engage/engage_signup/',
                    headers={
                        "X-API-KEY": settings.API_KEY,
                        'X-USERNAME': username,
                        'X-PASSWORD': password
                    }
            )
            response_data = insight_scope_auth.json()
            status_code = insight_scope_auth.status_code 
            # if status is 401, that mean authentication failed
            # if its 422, that means EDI fields are not filled
            if status_code == status.HTTP_401_UNAUTHORIZED or status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
                return Response(ErrorSerializer(dict(error=response_data.get('error'))).data, status=status.HTTP_200_OK)

            # check if user_already_exist, (might wanna cross sync?)
            try:
                user_already_exist = User.objects.get(Q(username=response_data.get('username')) | Q(email=response_data.get('email')))
            except ObjectDoesNotExist:
                user_already_exist = None

            if user_already_exist:
                return Response(
                    ErrorSerializer(dict(error="A user with the same email or username already exists on the engage platform")).data,
                    status=status.HTTP_200_OK
                )

            # if we receive a status 200, means request went successfully
            if status_code == status.HTTP_200_OK:
                    # convert the response to JSON

                    # get necessary fields for user and userprofile model 
                    user_profile_fields = ['profile_picture', 'linkedin_link', 'twitter_link', 'research_gate_link']
                    user_fields=['username', 'password', 'email', 'first_name', 'last_name']
                    # set the user data
                    user_fields_data = {field: response_data.get(field) for field in user_fields}
                    user_profile_data = {field: response_data.get(field) for field in user_profile_fields}

                    # get the question and option data of EDI
                    edi_questions=UserProfileQuestion.objects.filter(section_id=EDI_SECTION_ID)
                    edi_option=UserProfileOption.objects.filter(question__section_id=EDI_SECTION_ID)

                    with transaction.atomic():
                        # Create engage User
                        engage_user = User.objects.create(is_active = False, **user_fields_data)
                        # create engage user profile 
                        user_profile = UserProfile.objects.create(
                            user=engage_user, role=role,
                            insight_scope_id=response_data.get('insight_scope_user_id'),
                            linked_to_insight_scope=True,
                            has_logged_in=False,
                            **user_profile_data
                        )
                        # set the user profile answer for edi info only if we are getting them from insightScope
                        if response_data.get('is_edi_info'):
                        # Prepare the data to set answers for each EDI field
                            edi_data = match_edi_values_from_insight_scope(edi_questions, response_data, edi_option)

                            # Prepare a list of UserProfileAnswer objects
                            user_profile_answers = [
                                UserProfileAnswer(
                                    user_profile=user_profile,
                                    question_id=item['question'],
                                    selected_options=item['selected_options']
                                )
                                for item in edi_data
                            ]

                            # Bulk create the UserProfileAnswer objects
                            UserProfileAnswer.objects.bulk_create(user_profile_answers)
                        # finally send an email to the user
                        access = AccessToken().for_user(engage_user)

                        access.set_exp(lifetime=timedelta(hours=1))

                        access['email'] = engage_user.email

                        email_params = {
                            'email': engage_user.email,
                            'user': engage_user,
                            'button_link': f"{settings.SERVER_NAME}activate_user/{access}/",
                            'button_text': "Activate Account",
                            'user_from_platform': "insightScope",
                            'base_template': "base_template_engage.html"
                        }

                        email = EngageEmail(
                            subject=f'Engage | {EmailTemplateConstants.SUBJECT_REGISTRATION_ACTIVATION.format("Engage")}',
                            template_name=EmailTemplateConstants.REGISTRATION_ACTIVATION,
                            template_params=email_params
                        )
                        email.set_recipients(to=email_params["user"].email, cc=email_params['user'].email)
                        email.send()
                        return Response(SuccessSerializer(dict(success="Created engage profile, please check your email")).data, status=status.HTTP_200_OK)
            else:
                return Response(ErrorSerializer(dict(error="Unable to create user at this moment, please try again.")).data, status=status.HTTP_200_OK)
        except requests.exceptions.ConnectionError:
            return Response(ErrorSerializer(dict(error="The request to insightScope was unsuccessful.")).data, status=status.HTTP_200_OK)


class ResendActivationEmail(APIView):
    throttle_classes = [ResendActivationEmailThrottle]

    def throttled(self, request, wait):
       # Convert seconds to a timedelta object
        wait_timedelta = timedelta(seconds=wait)

        # Create a datetime object representing the current time
        current_time = datetime.utcnow()

        # Calculate the future time when the request will be allowed
        future_time = current_time + wait_timedelta

        # Format the wait time and future time into a readable format
        formatted_wait_timedelta = format_timedelta(wait_timedelta)
        formatted_future_time = future_time.strftime('%Y-%m-%d %Hhr : %Mmins')

        raise exceptions.Throttled(detail={
            "message": f"Limit exceeded. Try again after {formatted_wait_timedelta}. \
                        The next request will be allowed at {formatted_future_time}. \
                        If you think this is a mistake contact admin.({settings.DEFAULT_FROM_EMAIL})"
        })


    def post(self, request):
        """Post request to resend the verification access token"""
        username_or_email = request.data.get('username_or_email')

        try:
            user = User.objects.get(Q(username=username_or_email) | Q(email=username_or_email))
            if user.is_active:
                return Response(SuccessSerializer(dict(success=user_already_active)).data, status=status.HTTP_200_OK)

            access = AccessToken().for_user(user)

            access.set_exp(lifetime=timedelta(hours=1))

            access['email'] = user.email

            email_params = {
                'email': user.email,
                'user': user,
                'button_link': f"{settings.SERVER_NAME}activate_user/{access}/",
                'button_text': "Activate Account",
            }

            email = EngageEmail(
                subject=f'Engage | Activate your account',
                template_name=EmailTemplateConstants.RESEND_ACTIVATION_EMAIL,
                template_params=email_params
            )
            email.set_recipients(to=email_params["user"].email, cc=email_params['user'].email)
            email.send()
            return Response(SuccessSerializer(dict(success=resend_activation_email)).data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(ErrorSerializer(dict(error="User does not exist.")).data, status=status.HTTP_200_OK)


class CheckSignupPlatformStatus(APIView):

    def get(self, request):
        """
            GET request to check the status of the platform for signup
        """
        try:
            requests.get(settings.INSIGHTSCOPE_SERVER)
            return Response(SuccessSerializer(dict(success={'down_status': False})).data, status=status.HTTP_200_OK)
        except requests.exceptions.ConnectionError:
            return Response(ErrorSerializer(dict(error=insight_scope_status)).data, status=status.HTTP_200_OK)
