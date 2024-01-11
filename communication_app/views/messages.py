from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from engage_app.models import ResearchProjectParticipant
from communication_app.models import Message


def delete_message(request, message_id):
    # First check if the message exists on the system and if the user submitting this request is a lead researcher
    # or the user who created the message
    message = get_object_or_404(Message, id=message_id)
    authorized_user_list = [
        *[ResearchProjectParticipant.objects.filter(
            study=message.discussion_board.parent_task.research_project, is_active=True, is_principal_investigator=True
        ).values_list('user_id', flat=True)],
        request.user.id
    ]

    # If the user is authorized delete the message or send an error
    if message.sender_id in authorized_user_list:
        message.delete()
        return JsonResponse(dict(success="You have successfully deleted this message"), status=200)
    return JsonResponse(dict(success="You are not authorized to delete this message"), status=404)
