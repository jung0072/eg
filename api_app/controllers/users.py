import base64
import time
from concurrent.futures import ThreadPoolExecutor
from email.utils import parseaddr
from random import randint

from aws_s3_provider.S3Service import S3Service
from django.contrib.auth.models import User
from django.db.models import Q, Value as V
from django.db.models.functions import Concat
from django.http import JsonResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api_app.serializers import UserProfileInfoSerializer, ErrorSerializer, SuccessSerializer, DataSerializer, \
    EditUserProfileSerializer
from api_app.utils import remove_leading_trailing_whitespace
from api_app.utils.common import is_valid_email
from api_app.utils.permissions import CanViewAnonProfile
from auth_app.forms.user_profile import UserProfileForm
from auth_app.models import UserProfile, UserProfileQuestion
from auth_app.models import UserProfileSection
from auth_app.utils.common import get_default_profile_picture
from config import settings
from engage_app.utils.constants import UserRoles
from engage_app.models import ResearchProjectParticipant, ResearchProject


def user_json_with_accessbility_checks(requesting_user: User, user_details: User):
    """
    Returns a JSON object that represents the user, including information appropriate for the requesting user's permissions
    """

    # All roles get access to basic info
    user_json = {
        'id': user_details.id,
        'username': user_details.username,
        'full_name': user_details.get_full_name(),
        'role': user_details.userprofile.role,
        'profile_picture': user_details.userprofile.get_profile_image(),
        'email': user_details.email
    }

    # TODO: Implement this check later.
    users_share_project = False

    # If the requesting user is an admin or the two users share a project, add the rest
    if requesting_user.is_superuser or users_share_project:
        user_json['email'] = user_details.email

    return user_json


def user_json_list(requesting_user: User, user_details):
    """
    Like above but accepts a list instead
    """

    result = []
    for user in user_details:
        result.append(user_json_with_accessbility_checks(requesting_user, user))
    return result


@api_view(["GET"])
def query_users(request):
    """
    Returns a list of users on the system that match the provided query string
    """

    # Get the params
    search = request.GET['q'] if 'q' in request.GET else None
    exclude_uids = request.GET.getlist('exclude') if 'exclude' in request.GET else None
    role = request.GET['role'] if 'role' in request.GET else None
    sort = request.GET['sort'] if 'sort' in request.GET else None
    selected_users_count = request.GET['selected_users_count'] if 'selected_users_count' in request.GET else None

    # TODO(Nathan): Validate the url params.
    # TODO(Nathan): Add reverse sort param?

    # Annotate for full name and remove all unapproved users from this search and all researchers that are not active
    query = User.objects.annotate(
        full_name=Concat('first_name', V(' '), 'last_name')
    ).exclude(
        userprofile__is_minimum_profile_check_valid=False
    ).exclude(
        (
            Q(userprofile__role="RESEARCHER") & Q(userprofile__is_active_researcher=False)
        ) | Q(userprofile__opt_out_project_invitations=True)
    )

    # If the role was specified, filter that
    if role:
        query = query.filter(userprofile__role=role)

    # If there are excluded users, exclude them
    if exclude_uids:
        query = query.exclude(id__in=exclude_uids)

    # If a search text was provided, filter that
    if search:
        query = query.filter(Q(full_name__icontains=search) | Q(username=search) | Q(email=search))

    # If we want to sort alphabetically do that now
    if sort == 'alpha':
        query = query.order_by('full_name')

    # Make sure we pre-fetch related to avoid making several other database calls to fetch userprofile info
    query = query.prefetch_related()

    # Check if the query is empty and if it is a valid email, if it is give the option to invite a new user
    if query.exists():
        return JsonResponse({'users': user_json_list(request.user, query)})
    elif not query.exists() and is_valid_email(search):
        # Since we have checked the system and this email is not used and the search is a valid email address
        # we can send a default new user which we can then prompt to create an account on submit
        default_pic = get_default_profile_picture()
        default_pic = default_pic.decode('ascii')
        return JsonResponse({'users': [dict(
            username=search,
            # ID is a random negative number between 1 and 100000, so it does not correspond to existing users
            id=randint(-100000, -1),
            full_name=search,
            role="",
            email=search,
            profile_picture=default_pic
        )]})

    return Response(
        data=ErrorSerializer(dict(error="There was an error searching for the users")).data,
        content_type="application/json",
        status=status.HTTP_404_NOT_FOUND
    )


@api_view(["GET"])
def user_directory_preview(request):
    """
    Used alongside the User Directory Modal in the react app. Returns a few users of each type to populate the preview.
    """

    # Build the list of roles we want to preview
    roles = [
        UserRoles.RESEARCHER,
        UserRoles.CLINICIAN,
        UserRoles.PATIENT,
        UserRoles.FAMILY_OF_PATIENT
    ]

    result = {}
    # make sure we are not sending anonymous user or the opt_out users
    for role in roles:
        if role is None:
            continue
        result[role.name] = user_json_list(
            request.user,
            User.objects.filter(
                userprofile__role=role.name, 
                userprofile__opt_out_project_invitations=False,
                userprofile__is_anonymous=False,
            )[:3]
        )

    return JsonResponse(result)


class UserProfileInfoController(APIView):
    permission_classes = [IsAuthenticated, CanViewAnonProfile]

    def get(self, request, user_id):
        if not request.user.id:
            return Response(
                data=dict(error="You are currently not authenticated"),
                content_type="application/json",
                status=status.HTTP_401_UNAUTHORIZED
            )
        user_profile = UserProfile.objects.filter(user_id=user_id)
        if user_profile.exists():
            # TODO: Limit this data returned so only the required data for each profile type is returned
            serialized_data = UserProfileInfoSerializer(user_profile.first().to_json())
            return Response(data=serialized_data.data, content_type="application/json", status=200)
        return Response(
            data=ErrorSerializer(dict(error="User does not exist")).data, content_type="application/json",
            status=status.HTTP_404_NOT_FOUND
        )


class EditUserProfileController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_user_profile = UserProfile.objects.filter(user_id=request.user)
        all_questions = UserProfileQuestion.objects.filter(**current_user_profile.first().get_role_query())

        if current_user_profile:
            current_user_profile = current_user_profile.first()
            response_data = dict(data={
                **current_user_profile.to_json_form_values()
            })
            serialized_data = DataSerializer(dict(data=response_data))
            # check for the question type and if type is a single answer value change the type of answer
            update_value_for_question_type = ['RADIO_BUTTON', 'RADIO_BUTTON_CIRCLE', 'RADIO_BUTTON_BOX']
            for key, value in serialized_data.data.items():
                for question in all_questions:
                    for sub_key, sub_value in value['data'].items():
                        if str(question.id) == sub_key and question.type in update_value_for_question_type:
                            serialized_data.data['data']['data'][sub_key] = str(sub_value[0])
            return Response(
                data=serialized_data.data, status=200, content_type="application/json"
            )

        response_data = dict(error="This is an invalid request for user data")
        serialized_data = ErrorSerializer(response_data)
        return Response(
            data=serialized_data.data,
            status=200, content_type="application/json"
        )

    def post(self, request):
        # Split up the post data for the basic settings and the remaining branching questions form data
        current_user_profile = UserProfile.objects.get(user_id=request.user)
        # transform the post data before sending it to the form so we can modify any extra name and values
        user_profile_post_data = transform_post_data_to_user_profile_fields(request.data.copy(), current_user_profile)
        # Check if the profile form is valid and update the insight-scope database with a post request
        profile_form = UserProfileForm(user_profile_post_data, request.FILES, instance=current_user_profile)
        if profile_form.is_valid():
            is_researcher_ready_for_review = 'X-SUBMIT-RESEARCHER-FOR-REVIEW' in request.headers
            current_user_profile.save_answers(user_profile_post_data, is_researcher_ready_for_review)

            # Save the profile form and send the data over to insight-scope
            current_user_profile = profile_form.save(current_user_profile.user_id)
            current_user_profile.is_minimum_profile_check_valid = False  # If we ever save data, then invalidate check
            if 'research_interests' in profile_form.cleaned_data:
                current_user_profile.research_interests.set(profile_form.cleaned_data['research_interests'])
            current_user_profile.save()

            # serialize the response and send back the success or error
            response_data = dict(success="The User Profile Answers were saved")
            serialized_data = SuccessSerializer(response_data)
            return Response(
                data=serialized_data.data, status=200, content_type="application/json"
            )
        else:
            response_data = dict(error="The User Profile Form was not valid", form_errors=profile_form.errors)
            serialized_data = ErrorSerializer(response_data)
            return Response(
                data=serialized_data.data,
                status=200, content_type="application/json"
            )

    def patch(self, request):
        user_profile = UserProfile.objects.get(user_id=request.user.id)
        # first remove any properties that do not have values
        current_role = user_profile.role

        user_dict = dict(
            first_name=request.user.first_name,
            last_name=request.user.last_name,
            email=request.user.email,
            username=request.user.username,
        )
        normalized_field_list = ["username", "email"]
        if "user" in request.data:
            for key, val in request.data["user"].items():
                if not val == '' and val is not None:
                    user_dict[key] = remove_leading_trailing_whitespace(val) if key in normalized_field_list else val

        # Check if the username is unchanged, if it is remove it so we can avoid hitting the validation issue
        if "username" in user_dict and user_dict["username"] == request.user.username:
            user_dict.pop("username")
        if "email" in user_dict and user_dict["email"] == request.user.email:
            user_dict.pop("email")
        profile_dict = dict(
            user_location=user_profile.user_location,
            icu_institute=user_profile.icu_institute,
            pronouns=user_profile.pronouns
        )
        if "user_profile" in request.data:
            # Check the key and val of the item, if its not empty and its not an empty string, save it to process
            for key, val in request.data["user_profile"].items():
                # Check if the value is a list (multiple select) or just a regular string val
                if isinstance(val, list) and len(val) > 0:
                    profile_dict[key] = val
                elif not val == '' and val is not None and not isinstance(val, list):
                    profile_dict[key] = val
        request_data = dict(user=user_dict, user_profile=profile_dict)
        user_serializer = EditUserProfileSerializer(data=request_data, instance=user_profile)
        if user_serializer.is_valid():
            user_serializer.update(validated_data=request_data, instance=user_profile)
            user_profile.is_minimum_profile_check_valid = False  # If we ever modify the data, then invalidate check
            return Response(
                SuccessSerializer(dict(success="You have updated your basic information")).data,
                content_type="application/json", status=status.HTTP_201_CREATED
            )
        error_response = ErrorSerializer(dict(error="Could not update account", form_errors=user_serializer.errors))
        return Response(error_response.data, content_type="application/json", status=status.HTTP_409_CONFLICT)


def transform_post_data_to_user_profile_fields(post_data, user_profile):
    # Check if the modification keys are in the post data and replace them with their actual values
    if "first_language_mod" in post_data:
        post_data["first_language"] = [post_data.pop("first_language_mod")]
    if "most_used_language_mod" in post_data:
        post_data["most_used_language"] = [post_data.pop("most_used_language_mod")]

    # Convert the date time to just a date by taking the first ten characters of it
    if "date_of_birth" in post_data:
        post_data["date_of_birth"] = post_data["date_of_birth"][0:10]

    user_profile_dict = dict()
    for setting in UserProfileForm.Meta.fields:
        user_profile_dict[setting] = post_data.pop(setting) if setting in post_data else user_profile.__getattribute__(
            setting
        )

    # Copy over any of the remaining fields of the post data into the user profile dict and return it to the request
    user_profile_dict.update(post_data)
    return user_profile_dict


class UserProfileCompletionCheckController(APIView):
    def get(self, request):
        user_profile = UserProfile.objects.filter(user=request.user).first()
        profile_check, incomplete_questions = user_profile.minimum_profile_completion_check()
        if profile_check:
            data = dict(success="You have completed your profile")
            serialized_data = SuccessSerializer(data)
            return Response(content_type="application/json", status=status.HTTP_200_OK, data=serialized_data.data)
        serialized_data = ErrorSerializer(dict(
            error="You have not completed your user profile questions", form_errors=incomplete_questions
        ))
        return Response(content_type="application/json", status=status.HTTP_200_OK, data=serialized_data.data)


class UserProfileFormController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Query the role of the user profile and send back all the information for their user profile questions
        as json"""
        user_profile = get_object_or_404(UserProfile.objects.select_related('user'), user=request.user)
        questions_list = UserProfileQuestion.objects.filter(**user_profile.get_role_query()).select_related('section')

        # Prefetch related sections to reduce database queries
        sections_list = UserProfileSection.objects.filter(
            id__in=questions_list.values_list('section_id', flat=True)
        ).order_by('order_number')

        # Execute the get_section_json method concurrently for each section in sections_list and the
        # get_question_json_list for each question in the questions list. The executor will manage the threads and
        # will run the code concurrently
        with ThreadPoolExecutor() as executor:
            section_json_list = executor.map(self.get_section_json_list, sections_list)
            question_json_list = executor.map(self.get_question_json_list, questions_list)

        # serialize the response data and send it to the user
        response_data = dict(sections=section_json_list, question_data=question_json_list)
        serialized_data = DataSerializer(dict(data=response_data))
        return Response(data=serialized_data.data, status=status.HTTP_200_OK, content_type="application/json")

    @staticmethod
    def get_section_json_list(section: UserProfileSection) -> dict:
        return section.to_json()

    @staticmethod
    def get_question_json_list(question: UserProfileQuestion) -> dict:
        return question.get_render_chan_json


class UserProfilePictureController(APIView):
    @staticmethod
    def build_unauthorized_user_error_response():
        return Response(
            data=dict(error="You are not authorized to update the profile picture"),
            content_type="application/json",
            status=status.HTTP_401_UNAUTHORIZED
        )

    @staticmethod
    def build_null_picture_received_error_response():
        return Response(
            data=ErrorSerializer(dict(error="Null profile picture received")).data,
            content_type="application/json",
            status=status.HTTP_400_BAD_REQUEST
        )

    @staticmethod
    def upload_profile_picture(user_profile, picture):
        file_name = user_profile.user.username + '.' + picture.name.split('.')[-1]
        file_name = S3Service(settings.AWS_S3_BUCKET_INSIGHTSCOPE).upload_user_photo(
            user_profile.user_id,
            file_name,
            picture
        )
        user_profile.profile_picture = file_name
        user_profile.save()

    def get(self, request, user_id):
        user_profile = get_user_profile(user_id)

        if not user_profile:
            return build_nonexistent_user_profile_error_response(user_id)

        image_uri = f'data:;base64,{user_profile.get_profile_image()}'
        image_data = image_uri.partition('base64,')[2]
        image_binary = base64.b64decode(image_data)
        return HttpResponse(image_binary, content_type='image/png', status=200)

    def post(self, request, user_id):

        if not request.user.id or request.user.id != user_id:
            return self.build_unauthorized_user_error_response()

        user_profile = get_user_profile(user_id)

        if not user_profile:
            return build_nonexistent_user_profile_error_response(user_id)

        file = request.FILES.get('picture', None)

        if not file:
            return self.build_null_picture_received_error_response()

        self.upload_profile_picture(user_profile, file)

        response = SuccessSerializer(dict(success="Successfully uploaded the profile picture"))
        return Response(data=response.data, content_type="application/json", status=200)


def get_user_profile(user_id):
    user_profile = UserProfile.objects.filter(user_id=user_id)
    return user_profile.first() if user_profile.exists() else None


def build_nonexistent_user_profile_error_response(user_id):
    return Response(
        data=ErrorSerializer(dict(error="User profile does not exist")).data,
        content_type="application/json",
        status=status.HTTP_404_NOT_FOUND
    )


class ArchiveUserProjectController(APIView):
    def post(self, request):
        # First Validate the project that we need to archive
        project_id_to_archive = request.data.get('project_id', None)
        research_project = ResearchProject.objects.filter(id=project_id_to_archive)
        if research_project.exists():
            research_project = research_project.first()

            # Check if the project is globally archived
            if research_project.is_archived:
                # Send an error response to the user
                return Response(
                    data=ErrorSerializer(dict(error="The project has been globally archived, and unarchiving is only possible after the creator updates it.")).data,
                    content_type="application/json",
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Now that we have validated the project check to see if the user is even apart of the project
            participation = ResearchProjectParticipant.objects.filter(user=request.user, study=research_project)

            if participation.exists():
                participation = participation.first()

                # Finally we can update the archived state of the project by toggling
                participation.is_archived = not participation.is_archived
                participation.save()

                # Send a response to the user saying this project was successfully archived
                return Response(
                    data=SuccessSerializer(dict(success="Successfully archived the research project.")).data,
                    content_type="application/json", status=200
                )

        # Send response saying the project was not found
        return Response(
            data=ErrorSerializer(dict(error="The research project does not exists or you are not on the project")).data,
            content_type="application/json",
            status=status.HTTP_404_NOT_FOUND
        )
