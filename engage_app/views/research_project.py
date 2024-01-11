import json
import secrets
import string

from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponseNotAllowed
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404, reverse

from auth_app.models import UserProfile
from communication_app.models import DiscussionBoard, Message, Notification
from communication_app.utils import NotificationTypes
from config import settings
from engage_app.forms import ResearchProjectForm, ResearchProjectTaskForm, AddNewTeamMemberToProjectForm
from engage_app.models import ResearchProject, ResearchProjectQuestion, ResearchProjectTask, \
    ResearchProjectParticipant
from engage_app.utils import UserRoles


def research_project_info(request, research_project_id: int = None):
    research_project = get_object_or_404(ResearchProject, id=research_project_id)
    research_project_tasks = ResearchProjectTask.objects.filter(research_project=research_project)
    permissions = ResearchProjectParticipant.objects.filter(
        user_id=request.user.id, study_id=research_project_id
    )
    user_profile = get_object_or_404(UserProfile, user=request.user)
    context = dict(
        research_project=research_project,
        research_project_tasks=research_project_tasks,
        user=request.user,
        current_user_profile=user_profile,
        permissions=permissions.first(),
        permission_role=permissions.first().get_current_role() if permissions.exists() else "Not on Team",
        task_form=ResearchProjectTaskForm(),
        task_form_action=f"/app/research_project/{research_project.id}/add_task/",
        new_team_member_form=AddNewTeamMemberToProjectForm(study_id=research_project_id),
        new_team_member_form_action=f"/app/research_project/add_team_member/{research_project_id}/",
        current_team_members=ResearchProjectParticipant.objects.filter(study_id=research_project_id, is_active=True),
        requesting_team_members=ResearchProjectParticipant.objects.filter(
            study_id=research_project_id, is_active=False, is_approved=False
        ),
        edit_project_form=ResearchProjectForm(instance=research_project),
        edit_project_form_action=f'/app/research_projects/{research_project.id}/edit_project/',
    )
    return render(request, 'engage_app/research_project/research_project_details.html', context=context)


@login_required
def save_permissions(request, research_project_id):
    permissions_dict = json.loads(request.body)

    if not permissions_dict or not permissions_dict['permissions']:
        return JsonResponse(dict(error='Permission set not found in the request body'), status=400)

    for permission in permissions_dict['permissions']:
        user_id = permission['user_id']
        permission_set = ResearchProjectParticipant.objects.filter(study_id=research_project_id, user_id=user_id)
        permission_set.update(is_principal_investigator=permission['is_lead_researcher'],
                              is_active=permission['is_active'])

    return JsonResponse(data=dict(success='Successfully updated the permissions'), status=200)


@login_required
def add_project(request, research_project_id: int = None):
    """Create/ Edit a new Research Project. If this is a POST request, we are saving the form, otherwise we are
    sending the user to a blank new form"""
    # First check if the current user is an approved researcher
    current_user_profile = get_object_or_404(UserProfile, user=request.user)
    if not current_user_profile.is_active_researcher:
        return HttpResponseNotAllowed(
            "You do not have permissions to create a project, please contact the admin if you think this a mistake"
        )

    # If the project id was supplied, we can find the project and instantiate the forms with the instance or None
    current_project = ResearchProject.objects.filter(id=research_project_id).first()

    # Next using the request method instantiate the research project form and return the appropriate view
    if request.method == 'GET':
        study_form = ResearchProjectForm(
            instance=current_project, project_creator_id=request.user.id, initial={'contact_email': request.user.email}
        )
    elif request.method == 'POST':
        post_data = request.POST.copy()
        study_form = ResearchProjectForm(post_data, instance=current_project, project_creator_id=request.user.id)
        if study_form.is_valid():
            new_project = study_form.save()
            new_project.research_interests.set(study_form.cleaned_data['research_interests'])
            new_project.save()

            # If there is a current project, that means we are editing the project and we can just send the success message
            if current_project:
                return JsonResponse(
                    dict(success=f"You have updated the research project {new_project.title}"),
                    status=401
                )

            # Otherwise return the redirect to the newly created project page
            return redirect('engage_app:research_project_info', research_project_id=new_project.id)
    else:
        return JsonResponse(dict(error="This is not a valid request"), status=401)

    return render(
        request,
        template_name='engage_app/research_project/add_project.html',
        context=dict(
            research_project_form=study_form,
            page_title="Create a *NEW* Research Project",
            is_root_page=True,
            role=current_user_profile.role,
            profile_picture=current_user_profile.get_profile_image()
        )
    )


@login_required
def research_project_settings_form(request, research_project_id: int):
    research_project = get_object_or_404(ResearchProject, id=research_project_id)
    user_profile = UserProfile.objects.get(user_id=request.user.id)
    context = dict(
        page_title="Customize Research Project Settings",
        is_root_page=True,
        role=user_profile.role,
        profile_picture=user_profile.get_profile_image(),
        research_project=research_project,
    )
    return render(request, 'engage_app/research_project/edit_project_settings.html', context=context)


@login_required
def modify_research_project(request, research_project_id: int = None):
    # check_user_is_same_as_editing(request, user_id)
    user_profile = UserProfile.objects.get(user_id=request.user.id)
    research_project = get_object_or_404(ResearchProject, id=research_project_id) if research_project_id else None

    if request.method == 'GET':
        # Create and send the customize profile form page to the user
        user_role = user_profile.role
        context = dict(
            role=user_role,
            profile_picture=user_profile.get_profile_image(),
            **get_research_projects_questions_json(research_project.id)
        )
        # TODO: When merging in add in the research project details URL

        return JsonResponse(dict(success="The Research Project form was loaded", **context), status=200)

    elif request.method == 'POST':
        # Save the research project forms
        research_project = ResearchProject.objects.get(id=research_project_id)
        is_researcher_ready_for_review = 'X-SUBMIT-RESEARCHER-FOR-REVIEW' in request.headers

        # Use form values from post to search up a research project questions and save to an answer model
        # with their supplied options from the value
        research_project.save_answers(request.POST, is_researcher_ready_for_review)

        return JsonResponse(dict(success="The Research Project answers were saved"), status=200)


def get_research_projects_questions_json(research_project_id: int = None):
    research_project = ResearchProject.objects.filter(id=research_project_id).first()
    # user_profile = UserProfile.objects.get(user_id=user_id)

    # TODO: add the selected options from a user to this form
    # based on the user role retrieve all of the applicable questions and options and send them to the template
    # user_role = user_profile.role
    # Since caretaker and family of patient are treated the same but may have differing text, they will share
    # this user role level

    questions_list = ResearchProjectQuestion.objects.filter(parent_question=None, is_required_researcher=True)
    questions_json = list()
    sections_json = list()

    for question in questions_list:
        questions_json.append(question.to_json(research_project=research_project))

        section = question.section
        if section:
            single_section_json = section.to_json()
            if single_section_json not in sections_json:
                sections_json.append(single_section_json)

    return {'questions': questions_json, 'sections': sections_json}


@login_required
def add_research_project_task(request, research_project_id):
    if request.method == "POST":
        current_user_profile = get_object_or_404(UserProfile, user=request.user)
        permissions = ResearchProjectParticipant.objects.get(
            user_id=request.user.id, study_id=research_project_id
        )

        if not current_user_profile.is_active_researcher or not permissions.is_research_partner or not permissions.is_principal_investigator:
            return HttpResponseNotAllowed(
                "You do not have permissions to create a project, please contact the admin if you think this a mistake"
            )

        post_data = request.POST.copy()
        task_form = ResearchProjectTaskForm(
            post_data, task_creator_id=request.user.id, research_project_id=research_project_id
        )
        if task_form.is_valid():
            research_task = task_form.save()
            return JsonResponse(dict(
                success="You have successfully created the task",
                redirect_link=reverse(
                    'communication_app:research_project_discussion_boards',
                    kwargs={'research_project_id': research_project_id, 'task_id': research_task.id}
                )
            ), status=200)

    return JsonResponse(dict(error="This is not a valid request"), status=400)


@login_required
def get_user_projects_list(request):
    profile = get_object_or_404(UserProfile, user_id=request.user.id)
    completed_project_list, incomplete_project_list = profile.get_list_of_research_projects(show_incomplete=True)

    return render(request, 'engage_app/research_project/my_project_list.html', context={
        'full_name': request.user.get_full_name(),
        'profile_picture': profile.get_profile_image(),
        'project_list': incomplete_project_list,
        'completed_project_list': completed_project_list
    })


@login_required
def add_user_to_team(request, research_project_id):
    """After checking if the current user has access to add a team member, add the new user to the team"""
    if request.method == 'POST':
        # Get the current user profile and the research project, if the lead researcher or creator is making ths request
        # add the requested user to the project or return the appropriate response
        current_user_profile = get_object_or_404(UserProfile, user_id=request.user.id)
        research_project = get_object_or_404(ResearchProject, id=research_project_id)
        permissions = get_object_or_404(
            ResearchProjectParticipant, user_id=current_user_profile.user.id, study_id=research_project.id
        )

        if permissions.is_lead_researcher_or_creator:
            post_data = request.POST.copy()
            new_user_id = post_data.get('user_id', None)
            if new_user_id:
                # Check if the team member already exists, if they do send an error
                new_team_member_permissions = ResearchProjectParticipant.objects.filter(
                    study_id=research_project_id, user_id=new_user_id
                )
                if new_team_member_permissions.exists():
                    return JsonResponse(dict(error="This user is already apart of the team"), status=500)

            # if the user does not exist, add them to the project and send the appropriate response
            new_team_member_form = AddNewTeamMemberToProjectForm(post_data, study_id=research_project_id)
            if new_team_member_form.is_valid():
                new_team_member_form.save(study_id=research_project_id)
                return JsonResponse(dict(success="You have successfully added the user to the team"))
            return JsonResponse(dict(error=dict(new_team_member_form.errors.items())), status=500)
    return HttpResponseNotAllowed("This is not a valid request")


@login_required
def request_to_join_project(request, research_project_id):
    """Validate if the current user is a patient or an approved researcher then add them to the project. These users will
    be unapproved (inactive) until they get accepted by a principal investigator."""
    # First validate if the requested project exists
    research_study = get_object_or_404(ResearchProject, id=research_project_id)

    # Retrieve all of the current team members of the project, to make sure the requesting user is not on the team
    project_participants = ResearchProjectParticipant.objects.filter(study_id=research_project_id)
    if request.user.id in project_participants.values_list('user_id', flat=True):
        return JsonResponse(
            data=dict(error="Could not join project, you are already apart of the project"),
            status=401
        )

    # Using the requesting users role, check if they are an approved researcher or a patient partner
    user_profile = get_object_or_404(UserProfile, user=request.user)
    if user_profile.role in UserRoles.get_patient_partner_types():
        requested_patient_partner_role = True
    elif user_profile.is_approved_researcher:
        requested_patient_partner_role = False
    else:
        return JsonResponse(
            data=dict(error="This is not a valid request"),
            status=401
        )

    # Now that the user is validated, create the project participant record for the current user
    new_project_participant = ResearchProjectParticipant.add_user_to_team(
        user_id=request.user.id, study_id=research_project_id, is_patient_partner=requested_patient_partner_role,
        is_active=False, is_approved=False
    )

    if new_project_participant:
        # Send project owner a notification that
        Notification.objects.create(
            receiver=research_study.creator,
            type=NotificationTypes.PROJECT.value,
            source_id=research_project_id,
            content=f"{request.user.get_full_name()} has requested to join the project as a {new_project_participant.get_current_role()}",
            link=reverse('auth_app:react_project_details', args=[research_project_id]),
        )
        response_dict = dict(
            success=f"You've successfully requested to join {research_study.title} as a {new_project_participant.get_current_role()}",
        )
        response_status = 200
    else:
        response_dict = dict(
            error=f"Unable to make a request to join {research_study.title}",
        )
        response_status = 400

    return JsonResponse(
        data=response_dict,
        status=response_status
    )


@login_required
def join_research_study(request, research_project_id):
    """Validate if the current user has been requested to join a project and then update their permission to activate"""
    # First validate if the requested project exists
    research_study = get_object_or_404(ResearchProject, id=research_project_id)

    # Now using the users permissions record, check if they have been approved to the project but not activated
    permissions = get_object_or_404(
        ResearchProjectParticipant, study_id=research_project_id, user_id=request.user.id
    )

    # if the user is not valid for this request, abort early otherwise activate their permissions and save to the db
    if permissions.is_active or not permissions.is_approved:
        return JsonResponse(
            data=dict(error=f"Could not join the project {research_study.title} at this time"),
            status=200
        )

    # Save the updated permissions to the database
    permissions.is_active = True
    permissions.save()

    # Send a notification to the project creator saying this user has joined the project
    Notification.objects.create(
        receiver_id=research_study.creator_id,
        source_id=research_study.id,
        content=f'The user {permissions.user.get_full_name()} has accepted their invitation to the '
                f'project {research_study.title}. You can now update their permissions as needed.',
        link=reverse('auth_app:react_project_details', args=[research_project_id]),
        type=NotificationTypes.PROJECT.value
    )
    return JsonResponse(
        data=dict(success=f"You have successfully joined the Research Study {research_study.title}"),
        status=200
    )


# TODO: Refactor activate, delete and edit team member views to use same function with different signatures
# TODO: Create method to get a current users permissions if an only if they are a PI or Project Creator or Admin
@login_required
def activate_new_team_member(request, new_team_member_id: int, research_project_id: int):
    """Using the user id of the new team member and the research project id, activate the user in the project"""
    # First validate if the requested project exists and if the current user has the appropriate rights to modify
    research_study = get_object_or_404(ResearchProject, id=research_project_id)
    current_user_permissions = get_object_or_404(
        ResearchProjectParticipant, user_id=request.user.id, study_id=research_study.id
    )
    new_team_member_permissions = get_object_or_404(
        ResearchProjectParticipant, user_id=new_team_member_id, study_id=research_study.id
    )
    if not current_user_permissions.is_lead_researcher_or_creator or new_team_member_permissions.is_active:
        return JsonResponse(data=dict(
            error=f"This user is already activated and has access to the project"), status=500
        )

    # After validating the request, update the user and save to the database
    new_team_member_permissions.is_active = True
    new_team_member_permissions.save()

    # Give the added user a notification that they've been added
    Notification.objects.create(
        receiver=new_team_member_permissions.user,
        type=NotificationTypes.PROJECT.value,
        source_id=research_project_id,
        content=f"You've been approved for this project!",
        link=reverse('auth_app:react_project_details', args=[research_project_id]),
    )

    # Return a response for the toast
    return JsonResponse(data=dict(
        success=f"You have successfully added the user {new_team_member_permissions.user.get_full_name()} to the project {research_study.title}")
    )


@login_required
def remove_team_member(request, research_project_id, member_id):
    if not does_user_have_member_removal_privileges(user_id=request.user.id, project_id=research_project_id):
        return create_json_error(message='Only the Lead Researcher or the Creator can remove team members',
                                 status_code=403)

    if not can_remove_member(member_to_remove=member_id, project_id=research_project_id):
        return create_json_error(message='Lead Researchers and Project Creators cannot be removed from the team',
                                 status_code=405)

    research_study = get_object_or_404(ResearchProject, id=research_project_id)
    anonymous_user = get_anonymous_user(research_project_id)
    member_permissions = get_object_or_404(
        ResearchProjectParticipant, user_id=member_id, study_id=research_project_id
    )
    member_full_name = member_permissions.user.get_full_name()

    Message.objects.filter(
        discussion_board__parent_task__research_project_id=research_project_id,
        sender=member_permissions.user
    ).update(sender=anonymous_user)

    DiscussionBoard.objects.filter(
        board_creator=member_permissions.user
    ).update(board_creator=anonymous_user)

    ResearchProjectTask.objects.filter(
        task_creator=member_permissions.user
    ).update(task_creator=anonymous_user)

    member_permissions.user = anonymous_user
    member_permissions.save()

    return JsonResponse(
        data=dict(
            success=f'You have removed the user {member_full_name} from the project {research_study.title}'
        ),
        status=200
    )


@login_required
def delete_team_member(request, research_project_id, member_id):
    if not does_user_have_member_removal_privileges(user_id=request.user.id, project_id=research_project_id):
        return create_json_error(message='Only the Lead Researcher or the Creator can delete team members',
                                 status_code=403)

    if not can_remove_member(member_to_remove=member_id, project_id=research_project_id):
        return create_json_error(message='Lead Researchers or Project Creators cannot be removed from the team',
                                 status_code=405)

    research_study = get_object_or_404(ResearchProject, id=research_project_id)
    deleted_team_member_permissions = get_object_or_404(
        ResearchProjectParticipant, user_id=member_id, study_id=research_project_id
    )

    Message.objects.filter(
        discussion_board__parent_task__research_project_id=research_project_id,
        sender=deleted_team_member_permissions.user
    ).delete()

    DiscussionBoard.objects.filter(
        board_creator=deleted_team_member_permissions.user
    ).delete()

    ResearchProjectTask.objects.filter(
        task_creator=deleted_team_member_permissions.user
    ).delete()

    deleted_team_member_permissions.delete()

    return JsonResponse(
        data=dict(
            success=f'You have deleted the user {deleted_team_member_permissions.user.get_full_name()} from the project {research_study.title}'
        ),
        status=200
    )


def does_user_have_member_removal_privileges(user_id, project_id):
    current_user_permissions = get_object_or_404(
        ResearchProjectParticipant, user_id=user_id, study_id=project_id
    )
    return current_user_permissions.is_lead_researcher_or_creator


def can_remove_member(member_to_remove, project_id):
    deleted_team_member_permissions = get_object_or_404(
        ResearchProjectParticipant, user_id=member_to_remove, study_id=project_id
    )
    return not deleted_team_member_permissions.is_lead_researcher_or_creator


def create_json_error(message, status_code):
    return JsonResponse(data=dict(error=message), status=status_code)


def get_anonymous_user(project_id):
    """Get an anonymous user to replace a current user of the project. Will create an anonymous user
    if none are found"""

    email_domain = settings.SCRIPT_USER_EMAIL_DOMAIN
    anonymous_user_first_name = settings.SCRIPT_USER_FIRST_NAME
    script_users = User.objects.filter(
        email__regex=rf'^[A-Za-z0-9._%+-]+@{email_domain}$',
        first_name=anonymous_user_first_name
    ).order_by('date_joined')

    if not script_users:
        return create_script_user(script_id=1)

    script_user_ids = script_users.values_list('id', flat=True)

    anonymous_users_on_project = ResearchProjectParticipant.objects.filter(
        user_id__in=script_user_ids,
        study_id=project_id
    )

    script_users_not_on_project = User.objects.filter(
        id__in=script_user_ids
    ).exclude(id__in=anonymous_users_on_project.values_list('user_id'))

    # return the first user if we have a script user not on a project
    if script_users_not_on_project.exists():
        return script_users_not_on_project.first()

    # if there is no script users then get the id of the last script user (from the username, after hyphen)
    # add 1 and create a new user with it
    last_script_id = int(script_users.last().last_name)
    return create_script_user(last_script_id + 1)


def create_script_user(script_id):
    alphabet = string.ascii_letters + string.digits
    password = ''.join(secrets.choice(alphabet) for _ in range(20))  # for a 20-character password
    email_domain = settings.SCRIPT_USER_EMAIL_DOMAIN
    firstname = settings.SCRIPT_USER_FIRST_NAME
    last_name = script_id
    username = f'{firstname}_{script_id}'

    return User.objects.create_user(
        username=username, email=f'{username}@{email_domain}', password=password, last_name=last_name,
        is_active=True, first_name=firstname
    )
