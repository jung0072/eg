import datetime

from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import redirect

from communication_app.models import Notification
from api_app.serializers import ErrorSerializer, SuccessSerializer


class UserNotificationListController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user:
            return Response(
                data=ErrorSerializer(dict(error="User is not authenticated")), status=status.HTTP_401_UNAUTHORIZED,
                content_type="application/json"
            )
        unread_notifications = Notification.objects.filter(receiver=request.user).order_by('-created_at')
        unread_notification_list = [notification.to_json() for notification in unread_notifications]
        serialized_data = UserNotificationsListSerializer(unread_notification_list, many=True)
        return Response(
            data=serialized_data.data, content_type="application/json", status=status.HTTP_200_OK
        )


class UserNotificationsListSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return {
            'source_name': instance.get('source_name'),
            'source_id': instance.get('source_id'),
            'content': instance.get('content'),
            'type': instance.get('type'),
            'link': instance.get('link'),
            'created_at': instance.get('created_at'),
            'read_at': instance.get('read_at'),
            'id': instance.get('id')
        }


class MarkUserNotificationsAsReadController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_user = request.user
        user_notifications = Notification.objects.filter(receiver=current_user, read_at__isnull=True)
        if user_notifications.exists():
            user_notifications.update(read_at=datetime.datetime.now(tz=datetime.timezone.utc))
        response_data = dict(success="You have marked all your notifications as read")
        serialized_data = SuccessSerializer(response_data)
        return Response(data=serialized_data.data, status=status.HTTP_200_OK, content_type="application/json")


class ReadUserNotificationController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, notification_id):
        """
            When the user clicks on a notification, they are routed through this view first which will redirect them to the
            actual link of the notification. This is just so that we can mark the notification as read.
        """
        # First make sure that notification actually exists
        try:
            notification = Notification.objects.get(pk=notification_id)
        except Notification.DoesNotExist:
            # Nope. Return them to the homepage.
            return redirect('/')

        # Then, make sure that this person is actually the receiver of the notification
        if notification.receiver != request.user:
            # Lol nope. Get outta here.
            return redirect('/')

        # Ok. They're clear to be forwarded to this notification. Mark it as read and redirect them.
        notification.read_at = datetime.datetime.now(tz=datetime.timezone.utc)
        notification.save()
        serialized_response = SuccessSerializer(dict(success=notification.link))
        return Response(content_type="application/json", status=status.HTTP_200_OK, data=serialized_response.data)
