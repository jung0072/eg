from django.shortcuts import render, get_object_or_404, reverse
from engage_app.decorators import admin_required_ajax
from django.http import JsonResponse
from django.contrib.auth.models import User
from engage_app.models import ResearchProject, SystemMessage
from auth_app.models import UserProfileQuestion, UserProfileSection, UserProfile, ResearchInterest
from auth_app.forms import UserProfileQuestionForm, UserProfileSectionForm
from engage_app.utils import EngageViews
from communication_app.models import Notification
from communication_app.utils import NotificationTypes
from email_app.utils import EngageEmail, EmailTemplateConstants
from engage_app.models import ResearchProjectParticipant


@admin_required_ajax
def administration_home(request):
    # Get the different totals for each type of user
    users = User.objects.all()
    active_users = users.filter(is_active=True)

    # Get the totals for the project types
    pending_projects = ResearchProject.get_pending_projects()
    active_projects = ResearchProject.get_active_projects()
    pending_researchers = UserProfile.get_pending_researchers()

    # List all the system messages
    system_messages = SystemMessage.objects.all().order_by('-created_at')

    # create the admin form objects based on POST or GET Request
    if request.method == 'GET':
        # Create new instances of forms
        user_profile_section_form = UserProfileSectionForm()
        user_profile_question_form = UserProfileQuestionForm()

    elif request.method == 'POST':
        # TODO: add the request header to check if a User Profile Question, Section, Option or another model is being saved

        requestFormType = request.headers.get('X-USER-MODEL-FORM-TYPE')
        instance_id = request.headers.get('X-INSTANCE-ID')

        # Create the model forms and depending on the submitted form type, add the instance, validate, save then return
        user_profile_section_form = UserProfileSectionForm(request.POST)
        user_profile_question_form = UserProfileQuestionForm(request.POST)
        if requestFormType == "SECTION" and instance_id is not None:
            user_profile_section_form.instance = UserProfileSection.objects.filter(id=instance_id).first()
        elif requestFormType == "QUESTION" and instance_id is not None:
            user_profile_question_form.instance = UserProfileSection.objects.filter(id=instance_id).first()

        if user_profile_section_form.is_valid():
            user_profile_section_form.save()
            return JsonResponse(dict(
                success="You have updated the User Profile Sections",
                instance=user_profile_section_form.instance.to_json()
            ))
        if user_profile_question_form.is_valid():
            user_profile_question_form.save()

            # TODO: Check what type of question was submitted and create options if applicable
            return JsonResponse(dict(
                success="You have updated the User Profile Questions",
                instance=user_profile_question_form.instance.to_json()
            ))

    else:
        return JsonResponse(dict(error="The specified request is not supported, please contact the developer team"))

    return render(request, 'administration/admin.html', context=dict(
        page_title="Administration",
        is_root_page=True,
        active_view=EngageViews.ADMIN.value,
        active_project_count=active_projects.count(),
        pending_project_count=pending_projects.count(),
        # TODO: Replace with real values from the system
        pending_researcher_count=pending_researchers.count(),
        user_count=active_users.count(),
        profile_section_form=user_profile_section_form,
        profile_question_form=user_profile_question_form,
        system_messages=system_messages
    ))


def get_user_profile_question_and_section_dict(language_questions=False):
    """Returns a dict of all of the user profile questions and sections. In some cases you may not want all of the
    language based questions so by default they are not included.
        Parameters:
            language_questions - boolean, defaults False. Will include all language based questions if true"""
    updated_query_dict = dict()
    if not language_questions:
        # Find all questions with a dev code not starting with L (whats inside the capturing group)
        updated_query_dict['dev_code__regex'] = r'^[^L].*$'

    questions = UserProfileQuestion.objects.all().filter(
        **updated_query_dict
    )
    sections = UserProfileSection.objects.all()

    question_json_list = [q.to_json() for q in questions]
    section_json_list = [s.to_json() for s in sections]

    return dict(
        user_profile_questions=question_json_list,
        user_profile_sections=section_json_list
    )


def get_engage_user_dict():
    users = UserProfile.objects.all().filter()
    users_json_list = [dict(id=u.user.id, **u.to_json()) for u in users]
    return dict(users=users_json_list)


@admin_required_ajax
def get_user_profile_questions_and_sections(request):
    user = request.user
    response_data = dict(
        admin=dict(
            username=user.username,
            id=user.id
        ),
        **get_user_profile_question_and_section_dict()
    )
    return JsonResponse(
        data=response_data,
        status=200  # Successful
    )


@admin_required_ajax
def get_system_user_profile_information(request):
    user = request.user

    response_data = dict(
        admin=dict(
            username=user.username,
            id=user.id
        ),
        **get_engage_user_dict()
    )

    return JsonResponse(
        data=response_data,
        status=200  # Successful
    )


def get_research_interests_dict():
    return dict(research_interests=[ri.to_json() for ri in ResearchInterest.objects.all().filter()])


@admin_required_ajax
def get_research_interests_information(request):
    user = request.user

    response_data = dict(
        admin=dict(
            username=user.username,
            id=user.id
        ),
        **get_research_interests_dict()
    )

    return JsonResponse(
        data=response_data,
        status=200  # Successful
    )


def get_pending_researchers_dict():
    # Get a list of all of the pending researcher profiles and return the json list of those researcher values
    # along with any other items needed for review like submission date
    pending_researcher_profiles = UserProfile.get_pending_researchers()
    pending_researchers_list = []
    for pending_researcher in pending_researcher_profiles:
        pending_researchers_list.append({
            'researcher_form_review_date': pending_researcher.researcher_form_review_date,
            # 'clinical_area': pending_researcher.get_researcher_clinical_area()['selected_options'][0],
            **pending_researcher.to_json()
        })
    return dict(
        pending_researchers=pending_researchers_list
    )


@admin_required_ajax
def get_pending_researchers(request):
    user = request.user

    response_data = dict(
        admin=dict(
            username=user.username,
            id=user.id
        ),
        **get_pending_researchers_dict()
    )

    return JsonResponse(
        data=response_data,
        status=200  # Successful
    )


@admin_required_ajax
def approve_researcher(request, researcher_id):
    """Approve a pending researcher to the system and give them access to features like the patient directory"""
    # Check if the user exists and if the user is a researcher that is unapproved
    current_user_profile = UserProfile.objects.filter(user_id=researcher_id)
    if not current_user_profile.exists() or not current_user_profile.first().is_researcher():
        return JsonResponse(data=dict(error="This user does not need to be updated"), status=400)

    current_user_profile = current_user_profile.first()
    # Now check if the user is already approved, if not modify the appropriate values
    if not current_user_profile.is_active_researcher:
        current_user_profile.is_pending_researcher = False
        current_user_profile.is_active_researcher = True
        current_user_profile.is_researcher_form_ready_for_review = False
        current_user_profile.save()

        # Send a notification to the approved researcher
        Notification.objects.create(
            receiver_id=researcher_id,
            source_id=researcher_id,
            content=f'You have now been approved to the system as a researcher. You can now create projects or view the'
                    f' patient directory from the side bar.',
            link=reverse('auth_app:react_user_profile', args=[researcher_id]),
            type=NotificationTypes.USER.value
        )
        return JsonResponse(data=dict(
            success="Success we have updated the current user", user=current_user_profile.user.first_name
        ), status=200)
    return JsonResponse(
        data=dict(error="This was not a valid request, please try again later or contact the admin"),
        status=400
    )


def get_pending_projects_dict():
    pending_projects = ResearchProject.get_pending_projects()
    pending_projects_list = []
    for project in pending_projects:
        pending_projects_list.append(dict(
            team_size=project.get_team_size(),
            icu_location=project.get_icu_location,
            **project.to_json()
        ))
    return dict(
        pending_projects=pending_projects_list
    )


@admin_required_ajax
def get_pending_projects(request):
    user = request.user

    response_data = dict(
        admin=dict(
            username=user.username,
            id=user.id
        ),
        **get_pending_projects_dict()
    )

    return JsonResponse(
        data=response_data,
        status=200  # Successful
    )


@admin_required_ajax
def approve_project(request, study_id):
    current_project = get_object_or_404(ResearchProject, id=study_id)

    # Now check if the user is already approved, if not modify the appropriate values
    if not current_project.is_approved:
        current_project.is_approved = True
        current_project.save()

        notification_params = {
            'receiver_id': current_project.creator_id,
            'source_id': current_project.id,
            'content': f'Your project has been approved. You can now invite new team members to get your project started.',
            'link': reverse('engage_app:research_project_info', args=[study_id]),
            'type': NotificationTypes.PROJECT.value
        }

        # Send a notification to the project creator saying their project has been approved
        Notification.objects.create(**notification_params)

        project_params = {
            'to_users': User.objects.get(id=current_project.creator_id),
            # TODO: Remove active users, only send to project leads
            'active_users': ResearchProjectParticipant.get_project_active_user(current_project.id),
            'link': reverse('auth_app:react_project_details', args=[current_project.id]),
            'project': ResearchProject.objects.get(id=current_project.id)
        }

        # Send an email to the user that their project is approved
        email = EngageEmail(
            subject=f'Engage | {EmailTemplateConstants.SUBJECT_PROJECT_APPROVED}',
            template_name=EmailTemplateConstants.PROJECT_STATUS,
            template_params=project_params
        )
        email.set_recipients(project_params['to_users'].email)
        email.send()

        return JsonResponse(data=dict(
            success="Success this project is now approved", project=current_project.to_json()
        ), status=400)


def get_research_projects_dict():
    research_projects = ResearchProject.get_active_projects()
    research_projects_list = []
    for project in research_projects:
        research_projects_list.append(dict(
            team_size=project.get_team_size(),
            icu_location=project.get_icu_location,
            **project.to_json()
        ))
    return dict(
        research_projects=research_projects_list
    )


@admin_required_ajax
def get_research_projects(request):
    user = request.user

    response_data = dict(
        admin=dict(
            username=user.username,
            id=user.id
        ),
        **get_research_projects_dict()
    )

    return JsonResponse(
        data=response_data,
        status=200  # Successful
    )


@admin_required_ajax
def delete_project(request, study_id):
    current_project = get_object_or_404(ResearchProject, id=study_id)

    # Now delete the research project and all associated records
    current_project.delete()
    return JsonResponse(
        data=dict(success="Success this project is now deleted", project=current_project.to_json()),
        status=400
    )
