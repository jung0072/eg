import json

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import reverse
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from communication_app.models import SystemMessage, Notification
from django.contrib.auth.models import User
from communication_app.utils import NotificationTypes
from email_app.utils import EngageEmail, EmailTemplateConstants
from engage_app.utils.constants import SystemMessageTypes

from api_app.serializers.system_message import SystemMessageSerializer
from api_app.serializers import ErrorSerializer, SuccessSerializer


class SystemMessageController(APIView):
    def get_permissions(self):
        # Only allow GET requests if the user is not admin
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]
    
    def post(self, request):
        if not request.body:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        data = json.loads(request.body)
        # If the type is NOTIFICATION, send a notification to all users  
        if data["type"] == SystemMessageTypes.NOTIFICATION.name:
            content = data["title"] + " / " + data["content"]
            for user in User.objects.all():
                notification = Notification.objects.create(
                    receiver=user,
                    type=NotificationTypes.SYSTEM.value,
                    content=content,
                )
                notification.save()
        # If the type is an email send it as an email
        elif data['type'] == SystemMessageTypes.EMAIL.name:
            SystemMessageController.send_system_email(data['title'], data['content'])
        # If the type is not NOTIFICATION, create a system message
        else:
            message = SystemMessage.objects.create(
                author=request.user,
                type=data["type"],
                title=data["title"],
                content=data["content"],
                is_published=data["is_published"] == True,
            )
            message.save()

        return Response(
                SuccessSerializer(dict(success="You have posted a system message")).data,
                status=status.HTTP_200_OK, content_type="application/json"
            )

    def get(self, request, message_id=None):
        if message_id:
            system_message = SystemMessage.objects.get(id=message_id)
            serialized_system_message = SystemMessageSerializer(system_message) 
        else:
            # If there is no message_id, return all messages
            system_messages = SystemMessage.objects.all()
            serialized_system_message = SystemMessageSerializer(system_messages, many=True)
        return Response(data=serialized_system_message.data, status=status.HTTP_200_OK)


    def put(self, request, message_id):
        system_message = SystemMessage.objects.filter(id=message_id)
        if not system_message:
            return Response(
                ErrorSerializer(dict(error="System message does not exist")).data,
                status=status.HTTP_404_NOT_FOUND, content_type="application/json"
            )
        if not request.body:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        data = json.loads(request.body)
        system_message.update(
            type=data["type"],
            title=data["title"],
            content=data["content"],
            is_published=data["is_published"] == True
        )
        return Response(
                SuccessSerializer(dict(success="You have updated a system message")).data,
                status=status.HTTP_200_OK, content_type="application/json"
            )


    def delete(self, request, message_id):
        system_message = SystemMessage.objects.filter(id=message_id)
        system_message.delete()
        return Response(
                SuccessSerializer(dict(success="You have deleted a system message")).data,
                status=status.HTTP_200_OK, content_type="application/json"
            )

    @staticmethod
    def send_system_email(subject: str, content: str):
        # Iterate over all the engage members and send an email, this will make sure they
        # don't see each others email addresses
        all_engage_users = User.objects.all()
        for user in all_engage_users:
            email_template_params = {
                'to_users': user.email,
                'user': user,
                'content': content
            }

            email = EngageEmail(
                subject=subject,
                template_name=EmailTemplateConstants.ADMIN_SYSTEM_MESSAGE_EMAIL,
                template_params=email_template_params
            )
            email.set_recipients(user.email)
            email.send()
