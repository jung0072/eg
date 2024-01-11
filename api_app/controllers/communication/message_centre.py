import base64

from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from auth_app.models import UserProfile
from communication_app.models import DiscussionBoard, Message
from engage_app.models import ResearchProjectParticipant


class MessageCentreView(APIView):
    def get(self, request):
        profile = UserProfile.objects.filter(user=request.user).first()

        if not request.user.is_authenticated:
            return JsonResponse(dict(error="User is not authenticated"), status=401)

        # Get the users discussion boards from all Research Studies
        data = {
            'user_id': request.user.id,
            'username': request.user.username,
            'discussion_boards': DiscussionBoard.get_all_users_discussion_boards(request.user.id),
            'active_view': "message_centre"
        }
        serialized_data = MessageCentreSerializer(data)
        return Response(data=serialized_data.data, content_type="application/json", status=200)


class MessageCentreSerializer(serializers.BaseSerializer):

    def to_representation(self, instance):
        return {
            'user_id': instance.get('user_id'),
            'username': instance.get('username'),
            'discussion_boards': instance.get('discussion_boards'),
            'active_view': instance.get('active_view'),
        }


class MessageImageAttachmentView(APIView):
    def get(self, request, message_id):
        """Get the profile picture for the specified user"""
        requested_user = get_object_or_404(User, id=request.user.id)
        requested_profile = get_object_or_404(UserProfile, user=requested_user)
        message = get_object_or_404(Message, id=message_id)
        project_permissions = ResearchProjectParticipant.objects.filter(
            study_id=message.discussion_board.linked_study.id, user_id=requested_user.id
        )
        if project_permissions.exists():
            # The image is supplied as base64, decode the image and return as an HTTPResponse
            image_uri = f'data:;base64,{message.get_image_attachment()}'
            image_data = image_uri.partition('base64,')[2]
            image_binary = base64.b64decode(image_data)
            return HttpResponse(image_binary, content_type='image/png', status=200)
        return JsonResponse(data=dict(error="There was an error processing this request"), status=400)
