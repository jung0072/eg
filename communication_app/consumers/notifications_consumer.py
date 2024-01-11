import json

from asgiref.sync import sync_to_async, async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.http import QueryDict
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from communication_app.models import Notification


class NotificationsConsumer(AsyncWebsocketConsumer):
    """
    Websocket consumer used to notify connected clients about new notifications.
    This consumer handles the WebSocket connections and notification broadcasting to connected clients.
    When a client connects, it decodes the user token from the query parameters to determine the user's identity.
    The consumer adds the user to the corresponding channel group, allowing notifications to be sent to the user's channel.
    When a new notification is saved, the `send_notification_to_user` signal receiver is triggered,
    which sends the notification to the appropriate user channel.
    """

    async def connect(self):
        """
        Called when the WebSocket is handshaking as part of the connection process.
        Decodes the token from the user to get the user id and adds the user to the connected users if valid.
        """
        # Decode the token from the user to get the user id
        user_id = self.get_user_id_from_query_params()

        if user_id is None:
            await self.close()
            return

        # Add the user to the connected users and accept the connection
        user_channel_name = NotificationsConsumer.get_user_channel_name(user_id)
        await self.channel_layer.group_add(user_channel_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        """
        Called when the WebSocket closes for any reason.
        Removes the user's open connection by discarding their channel group.
        """
        user_id = self.get_user_id_from_query_params()
        if user_id is not None:
            user_channel_name = NotificationsConsumer.get_user_channel_name(user_id)
            await self.channel_layer.group_discard(user_channel_name, self.channel_name)
        await self.close()

    def get_user_id_from_query_params(self):
        """
        Retrieves the user id from the query parameters by decoding the token string.
        Returns None if the token is invalid or not provided.
        """
        query_params = QueryDict(self.scope["query_string"].decode("utf-8"))
        token_string = query_params.get('token', '')
        try:
            # return the user id from the jwt payload
            token = AccessToken(token_string)
            return token.payload['user_id']
        except TokenError as token_error:
            print("Invalid JWT Token", token_error)
            return None

    @staticmethod
    def get_user_channel_name(user_id):
        """
        Generates the user channel name in a consistent format based on the user id.
        """
        return f"user_{user_id}"

    async def send_notification(self, event):
        """
        Sends the notification to the connected user(s).
        """
        notification = event['notification']
        await self.send(text_data=json.dumps(notification))

    @staticmethod
    @receiver(post_save, sender=Notification)
    def send_notification_to_user(sender, instance, **kwargs):
        """
        Signal receiver that sends the notification to the appropriate user channel.
        """
        notification = instance
        channel_layer = get_channel_layer()
        user_channel_name = NotificationsConsumer.get_user_channel_name(notification.receiver.id)
        notification_json = json.dumps(notification.to_json())
        async_to_sync(channel_layer.group_send)(
            user_channel_name,
            {
                'type': 'send_notification',
                'notification': notification_json,
            }
        )
