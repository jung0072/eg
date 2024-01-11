import base64
import logging

from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponseNotAllowed, QueryDict, HttpResponse
from django.shortcuts import render, redirect, get_object_or_404

from auth_app.forms.user_profile import UserProfileForm
from auth_app.models import UserProfile, UserProfileQuestion
from engage_app.utils import EngageViews

logger = logging.getLogger(__name__)


def check_user_is_same_as_editing(request, user_id):
    if request.user.id != user_id:
        return HttpResponseNotAllowed("You are not authorized to edit this profile")
    return None


def display_user_profile(request, user_id):
    user_profile = get_object_or_404(UserProfile, user__id=user_id)

    return render(request, 'engage_app/registration/user_profile.html', context=dict(
        user_profile=user_profile,
        user_profile_ri_form_action=f'/app/profile/{user_id}/edit_research_interests/'
    ))


def display_settings_user_profile(request, user_id):
    current_user_profile = UserProfile.objects.filter(user_id=user_id)

    if current_user_profile.exists():
        current_user_profile = current_user_profile.first()
        if current_user_profile.exists():
            # TODO: Remove user id from these routes and grab the id from the session
            error_response = check_user_is_same_as_editing(request, user_id)
            if error_response:
                return error_response

        return render(request, 'engage_app/registration/settings.html', {
            'user': current_user_profile, 'profile_picture': current_user_profile.get_profile_image(),
            'active_view': EngageViews.SETTINGS.value
        })
    else:
        return JsonResponse(dict(error="The current user profile does not exists"))


def get_public_user_profile_image(request, username):
    """Get the profile picture for the specified user"""
    requested_user = get_object_or_404(User, username=username)
    requested_profile = get_object_or_404(UserProfile, user=requested_user)

    # The image is supplied as base64, decode the image and return as an HTTPResponse
    image_uri = f'data:;base64,{requested_profile.get_profile_image()}'
    image_data = image_uri.partition('base64,')[2]
    image_binary = base64.b64decode(image_data)
    return HttpResponse(image_binary, content_type='image/png', status=200)


def modify_user_profile(request):
    # TODO: Remove user id from these routes and grab the id from the session
    user_id = request.user.id
    error_response = check_user_is_same_as_editing(request, user_id)
    if error_response:
        return error_response
    current_user_profile = UserProfile.objects.get(user_id=user_id)

    if request.method == 'GET':
        # Create and send the customize profile form page to the user
        profile_form = UserProfileForm(instance=current_user_profile)

        context = dict(
            page_title="Customize User Profile",
            is_root_page=True,
            role=current_user_profile.role,
            profile_picture=current_user_profile.get_profile_image(),
            active_view=EngageViews.SETTINGS.value,
            profile_form=profile_form,
            user=current_user_profile.user,
            user_profile=current_user_profile
        )
        return render(request, 'engage_app/registration/modify_user_profile.html', context=context)
    if request.method == 'POST':
        # Split up the post data for the basic settings and the remaining branching questions form data
        _, formatted_post_data = get_basic_profile_settings_form_data(request.POST.copy())

        # Check if the profile form is valid and update the insight-scope database with a post request
        profile_form = UserProfileForm(request.POST, request.FILES, instance=current_user_profile)
        if profile_form.is_valid():
            is_researcher_ready_for_review = 'X-SUBMIT-RESEARCHER-FOR-REVIEW' in request.headers
            current_user_profile.save_answers(formatted_post_data, is_researcher_ready_for_review)

            # Save the profile form and send the data over to insight-scope
            current_user_profile = profile_form.save(user_id)
            current_user_profile.research_interests.set(profile_form.cleaned_data['research_interests'])
            current_user_profile.save()
            post_data = dict(request.POST)
            # commenting out to test the engage platform without sso, as we are segregating platforms now    
            # user_profile_update_response = requests.post(
            #     url=f'{config_provider.get_config("sso", "server")}/engage/user_data/',
            #     data=post_data,
            #     headers={
            #         "X-API-KEY": settings.API_KEY, 'X-USERNAME': request.user.username,
            #         'X-USER-EMAIL': request.user.email
            #     }
            # )
            # if user_profile_update_response.status_code == 200:
            # return JsonResponse(dict(success="The User Profile Answers were saved"), status=200)
            return JsonResponse(dict(success="The User Profile Answers were saved"), status=200)
        else:
            return JsonResponse(
                data=dict(error="The User Profile Form was not valid", form_errors=profile_form.errors),
                status=200
            )
    return JsonResponse(
        data=dict(
            error="This is not a valid request, please try again later or contact the admin if you think this is a mistake"),
        status=400
    )


def get_user_profile_questions_json(request):
    # TODO: Remove user id from these routes and grab the id from the session
    user_id = request.user.id
    error_response = check_user_is_same_as_editing(request, user_id)
    if error_response:
        return error_response

    user_profile = UserProfile.objects.get(user_id=user_id)

    if request.method == 'GET':
        # TODO: add the selected options from a user to this form
        # based on the user role retrieve all of the applicable questions and options and send them to the template
        user_role = user_profile.role
        # Since caretaker and family of patient are treated the same but may have differing text, they will share
        # this user role level

        # TODO: add in user role
        questions_list = UserProfileQuestion.objects.filter(**user_profile.get_role_query(), parent_question=None)
        questions_json = list()
        sections_json = list()

        for question in questions_list:
            questions_json.append(question.to_json(user_profile=user_profile))

            section = question.section
            if section:
                single_section_json = section.to_json()
                if single_section_json not in sections_json:
                    sections_json.append(single_section_json)

        context = dict(
            role=user_role,
            questions=questions_json,
            sections=sorted(sections_json, key=lambda sect: sect['order_number']),
        )
        return JsonResponse(context, safe=True, status=200)

    return JsonResponse(
        dict(error="There was an error processing your request, contact the admin if you think this is a mistake"),
        status=400
    )


def user_profile_settings(request):
    """In the user profile settings a user should be able to choose their user role, chose their user profile photo
    and modify any features of the user profile base model"""
    user_id = request.user.id
    current_user_profile = UserProfile.objects.filter(user_id=user_id)
    # TODO: Remove user id from these routes and grab the id from the session
    if current_user_profile.exists():
        current_user_profile = current_user_profile.first()
        error_response = check_user_is_same_as_editing(request, user_id)
        if error_response:
            return error_response
        if request.method == "GET":
            # create a new user profile form and set the initial values
            profile_form = UserProfileForm(instance=current_user_profile)
        elif request.method == "POST":
            # validate the profile form based on the request POST dict and since we are uploading pictures check files
            profile_form = UserProfileForm(request.POST, request.FILES, instance=current_user_profile)

            # Check fi the profile form is valid and update the insight-scope database with a post request
            if profile_form.is_valid():
                # Save the profile form and send the data over to insight-scope
                current_user_profile = profile_form.save(user_id)
                current_user_profile.research_interests.set(profile_form.cleaned_data['research_interests'])
                current_user_profile.save()
                post_data = dict(request.POST)
                # commenting out as we will be testing engage without sso
                # user_profile_update_response = requests.post(
                #     url=f'{config_provider.get_config("sso", "server")}/engage/user_data/',
                #     data=post_data,
                #     headers={
                #         "X-API-KEY": settings.API_KEY, 'X-USERNAME': request.user.username,
                #         'X-USER-EMAIL': request.user.email
                #     }
                # )
                # changed the user profile settings to just redirect to the user_profile_setting
                # if user_profile_update_response.status_code == 200:
                #     return redirect('engage_app:user_profile_settings')
                # else:
                # TODO: trigger an operation to store the data and try again later as a background task
                return redirect('engage_app:user_profile_settings')

        return render(request, 'engage_app/registration/settings.html', context=dict(
            profile_form=profile_form,
            profile_picture=current_user_profile.get_profile_image(),
            user=current_user_profile.user,
            active_view=EngageViews.SETTINGS.value
        ))
    else:
        return JsonResponse(dict(error="The current user profile does not exists"))


def request_engage_user_data(request):
    """Request all of the available user data for the current user from the insightScope database.
    Check all user profile fields to see if the information is the same, if not update and save."""
    current_user = request.user
    current_user_profile = UserProfile.objects.get(user_id=current_user.id)
    error_response = check_user_is_same_as_editing(request, current_user.id)
    if error_response:
        return error_response
    # commented out the part as we will not be doing this with sso anymore.
    # response = requests.get(
    #     url=f'{config_provider.get_config("sso", "server")}/engage/user_data/',
    #     # All the names of the header changes after they are sent to a different django application
    #     # It changes from X-API-KEY to HTTP_X_API_KEY, basically hyphens are changes to under-score
    #     # and "HTTP_" is been added at the beginning of the name.
    #     headers={
    #         "X-API-KEY": settings.API_KEY,
    #         'X-USER-EMAIL': current_user.email,
    #         'X-USERNAME': current_user.username
    #     }
    # )

    # if response.status_code == 200:
    # response_user_data = response.json()
    # Validate all of the engage user data, if any of the edi fields are different, update and save
    # user_profile_fields = [
    #     'gender', 'sexual_orientation', 'is_identified_native', 'is_visible_minority', 'population_group',
    #     'has_disability', 'first_language', 'most_used_language', 'role', 'timezone', 'profile_picture'
    # ]
    # for profile_field in user_profile_fields:
    #     # Dynamically check each edi field in the user profile data, and if it is different modify the engage db
    #     if getattr(current_user_profile, profile_field) != response_user_data[profile_field]:
    #         setattr(current_user_profile, profile_field, response_user_data[profile_field])
    # current_user_profile.save()

    # # check if the current user is an admin, upgrade them on engage
    # is_admin = response_user_data['is_admin']
    # if is_admin:
    #     current_user.is_staff = True
    #     current_user.is_superuser = True
    #     current_user.save()

    # # if there is no role set on the current user profile, set it to passive
    # if not current_user_profile.role:
    #     current_user_profile.role = UserRoles.PASSIVE.name
    #     current_user_profile.save()

    # return HttpResponse("The request to insight-scope went through successfully")
    # else:
    #     return HttpResponse(response.status_code)


def get_basic_profile_settings_form_data(post_data):
    basic_settings_form_data_dict = dict()

    # Remove all of the items related to the profile form from the post data Query Dict so we can send only the
    # remaining items to the profile form settings save method
    for setting in UserProfileForm.Meta.fields:
        if setting in post_data:
            basic_settings_form_data_dict[setting] = post_data.pop(setting)[0]

    # Convert the dict into a query dict to be properly parsed by the django request/ response fn's
    basic_settings_query_dict = QueryDict('', mutable=True)
    basic_settings_query_dict.update(basic_settings_form_data_dict)
    return basic_settings_query_dict, post_data
