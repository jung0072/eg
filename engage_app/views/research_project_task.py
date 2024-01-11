from django.http import JsonResponse, Http404
from django.shortcuts import render, get_object_or_404

from auth_app.models import UserProfile
from communication_app.models import DiscussionBoard
from engage_app.forms import ResearchProjectTaskFileForm, ResearchProjectTaskAssignUserForm
from engage_app.models import ResearchProjectTaskFile, ResearchProjectTask, ResearchProjectParticipant, \
    ResearchProjectTaskAssignedUser


def research_project_task_details(request, research_task_id: int = None):
    research_task = get_object_or_404(ResearchProjectTask, id=research_task_id)
    research_project = research_task.research_project

    permissions = ResearchProjectParticipant.objects.filter(
        user_id=request.user.id, study_id=research_project.id
    )
    user_profile = get_object_or_404(UserProfile, user=request.user)
    discussion_boards = DiscussionBoard.objects.filter(parent_task=research_task)
    task_files = ResearchProjectTaskFile.objects.filter(parent_task=research_task)
    protocol_files = task_files.filter(is_protocol_file=True)
    user_submitted_files = task_files.filter(is_protocol_file=False)

    # instantiate the file forms with the current user profile and the research task id
    file_form = ResearchProjectTaskFileForm(
        uploader_id=user_profile.user_id, research_project_task_id=research_task.id
    )
    file_form.fields['is_protocol_file'].initial = True

    user_file_form = ResearchProjectTaskFileForm(
        uploader_id=user_profile.user_id, research_project_task_id=research_task.id
    )
    user_file_form.fields['is_protocol_file'].initial = False

    assign_user_form = ResearchProjectTaskAssignUserForm(
        current_user_id=request.user.id, research_project_id=research_project.id,
        research_project_task_id=research_task.id
    )

    context = dict(
        research_project=research_project,
        research_task=research_task,
        user=request.user,
        current_user_profile=user_profile,
        permissions=permissions.first(),
        discussion_board_count=discussion_boards.count(),
        permission_role=permissions.first().get_current_role() if permissions.exists() else "Not on Team",
        protocol_files=[pf.to_json() for pf in protocol_files],
        user_submitted_files=[usf.to_json() for usf in user_submitted_files],
        task_file_form=file_form,
        user_file_form=user_file_form,
        file_form_action=f"/app/task/{research_task_id}/upload_protocol_file/",
        assign_user_form=assign_user_form,
        assign_user_form_action=f"/app/task/{research_task_id}/assign_user/",
        assigned_users=ResearchProjectTaskAssignedUser.objects.filter(
            research_project_task=research_task_id
        )
    )
    return render(request, 'engage_app/research_project/research_project_task_details.html', context=context)


def upload_protocol_file(request, research_task_id):
    # Validate that the current user and project/ task exists, if they are a lead researcher or creator the user
    # will be allowed to submit their protocol file to the research project task
    user_profile = get_object_or_404(UserProfile, user=request.user)
    research_task = get_object_or_404(ResearchProjectTask, id=research_task_id)
    permissions = ResearchProjectParticipant.objects.get(
        user_id=request.user.id, study_id=research_task.research_project.id
    )
    if request.method == 'POST' and permissions.is_lead_researcher_or_creator:
        post_data = request.POST.copy()
        file_data = request.FILES.copy()
        task_file_form = ResearchProjectTaskFileForm(
            post_data, file_data, uploader_id=user_profile.user_id, research_project_task_id=research_task.id
        )
        if task_file_form.is_valid():
            task_file_form.save()
            return JsonResponse(dict(success="You have successfully uploaded the research task file."), status=200)
    else:
        return JsonResponse(dict(error="You are not authorized for this request"), status=401)
    return JsonResponse(dict(error="Could not upload the file at this time"), status=401)


def download_research_task_file(request, file_id):
    # if the file exists, download the file from aws and return it to the user
    research_file = get_object_or_404(ResearchProjectTaskFile, id=file_id)
    permissions = ResearchProjectParticipant.objects.get(
        user_id=request.user.id, study_id=research_file.parent_task.research_project.id
    )

    if (
            permissions.is_lead_researcher_or_creator and research_file.is_protocol_file) or not research_file.is_protocol_file:
        return research_file.download_file()
    return Http404


def assign_user_to_research_task(request, research_task_id):
    user_profile = get_object_or_404(UserProfile, user=request.user)
    research_task = get_object_or_404(ResearchProjectTask, id=research_task_id)
    permissions = ResearchProjectParticipant.objects.get(
        user_id=request.user.id, study_id=research_task.research_project.id
    )

    if request.method == 'POST' and permissions:
        post_data = request.POST.copy()
        assign_user_form = ResearchProjectTaskAssignUserForm(
            post_data, current_user_id=request.user.id,
            research_project_id=research_task.research_project_id,
            research_project_task_id=research_task.id
        )
        if assign_user_form.is_valid():
            assign_user_form.save()
            return JsonResponse(dict(success="You have successfully assigned this user to the task."), status=200)
    return JsonResponse(dict(error="This is an invalid request"), status=400)
