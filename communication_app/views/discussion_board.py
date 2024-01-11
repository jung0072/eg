from django.shortcuts import render, get_object_or_404, redirect, reverse
from django.http import JsonResponse, HttpResponseNotAllowed
from engage_app.models import ResearchProject, ResearchProjectTask, ResearchProjectParticipant
from auth_app.models import UserProfile
from communication_app.models import DiscussionBoard, Message, Notification
from communication_app.forms import DiscussionBoardForm
from communication_app.utils import NotificationTypes


def research_project_discussion_boards(request, research_project_id, task_id):
    # TODO: Check if the requesting user belongs to the project
    # TODO: Check if the requested discussion board exists
    research_project = get_object_or_404(ResearchProject, id=research_project_id)
    research_task = get_object_or_404(ResearchProjectTask, id=task_id)
    permissions = get_object_or_404(ResearchProjectParticipant, study_id=research_project_id, user_id=request.user.id)
    discussion_boards = DiscussionBoard.objects.filter(parent_task=research_task)
    user_profile = get_object_or_404(UserProfile, user=request.user)
    discussion_board_form = DiscussionBoardForm(parent_task_id=research_task.id, board_creator_id=request.user.id)

    project_info_context = dict(
        research_project_id=research_project_id,
        current_project=research_project,
        research_task=research_task,
        message_boards=discussion_boards,
        permissions=permissions,
        profile_picture=user_profile.get_profile_image(),
        discussion_board_form=discussion_board_form,
        # TODO: Create discussion board form submission route
        discussion_board_form_action=f"/chat/task/{research_task.id}/add_discussion_board/"
    )

    # TODO: Bugfix, NoReverseMatch Found for any of the engage_app url, only when accessing the communication_app template
    return render(
        request, context=project_info_context,
        template_name='communication_app/discussion_board/discussion_board_list.html'
    )


def chat_room(request, room_name: str):
    # validate and normalize the room name
    discussion_board = DiscussionBoard.objects.filter(chat_room_code=room_name)
    if not room_name and not discussion_board.exists():
        # TODO: Check if the room name is a valid discussion board
        return JsonResponse(dict(error="No room name was specified"), status=400)

    discussion_board = discussion_board.first()
    research_task = discussion_board.parent_task

    return render(request, 'communication_app/discussion_board/chat_room.html', {
        'room_name': room_name,
        'user': request.user,
        'discussion_board': discussion_board,
        'research_task': research_task
    })


def load_discussion_board_messages(request, room_name):
    discussion_board = DiscussionBoard.objects.filter(chat_room_code=room_name)

    if discussion_board.exists():
        # load all the previous messages
        discussion_board = discussion_board.first()
        messages = Message.objects.filter(discussion_board_id=discussion_board.id).order_by('created_at').exclude(
            is_deleted=True
        )
        previous_message_list = [item.to_json() for item in messages]

        return JsonResponse(dict(
            previous_messages=previous_message_list, success="Previous messages have been loaded"
        ), status=200)
    else:
        return JsonResponse(dict(error="This discussion board does not exist"), status=401)


def add_discussion_board(request, research_task_id):
    if request.method == "POST":
        current_user_profile = get_object_or_404(UserProfile, user=request.user)
        research_task = get_object_or_404(ResearchProjectTask, id=research_task_id)
        permissions = ResearchProjectParticipant.objects.get(
            user_id=request.user.id, study_id=research_task.research_project_id
        )

        if not current_user_profile.is_valid_research_project_member or not permissions.is_research_or_patient_partner:
            return HttpResponseNotAllowed(
                "You do not have permissions to create a project, please contact the admin if you think this a mistake"
            )

        post_data = request.POST.copy()
        research_task_id = post_data.pop('parent_task_id', research_task_id)
        discussion_board_form = DiscussionBoardForm(
            post_data, parent_task_id=research_task_id, board_creator_id=request.user.id
        )

        # After validating if the discussion board is valid, generate the url for the new chat room and send that
        # back in the response to the user so they can be redirected to the proper view
        if discussion_board_form.is_valid():
            discussion_board = discussion_board_form.save()
            new_discussion_board_url = reverse('communication_app:research_project_chat_room', args=[
                discussion_board.chat_room_code
            ])
            return JsonResponse(
                data=dict(
                    success="You have successfully created the discussion board, please wait while we reload the page",
                    redirect_link=new_discussion_board_url
                ),
                status=200
            )

    return JsonResponse(dict(error="This is not a valid request"), status=400)


def delete_discussion_board(request, discussion_board_id):
    """Delete a discussion board after validating."""
    discussion_board = get_object_or_404(DiscussionBoard, id=discussion_board_id)

    # Only allow either the discussion board creator or a lead researcher/ creator to delete the discussion board
    if discussion_board.user_can_modify_board(request.user.id):
        # First delete all the messages associated with this discussion board
        messages_to_board = Message.objects.filter(discussion_board=discussion_board)
        messages_to_board.delete()

        # Then delete all the notifications associated with this discussion board
        notifications_from_board = Notification.objects.filter(
            type=NotificationTypes.DISCUSSION.value, receiver_id=discussion_board.id
        )
        notifications_from_board.delete()

        # Now we can safely delete the discussion board
        discussion_board.delete()
        return JsonResponse(
            data=dict(
                success=f"You have deleted the discussion board: {discussion_board.title}",
                redirect_link=reverse('communication_app:research_project_discussion_boards', args=[
                    discussion_board.parent_task.research_project_id, discussion_board.parent_task_id
                ])
            ),
            status=200
        )
    return JsonResponse(
        data=dict(error="You are not allowed to delete this discussion board, please wait while we reload the page."),
        status=401
    )
