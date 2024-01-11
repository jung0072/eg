from django.contrib.auth.models import User
from django.db import models
from django.shortcuts import reverse


class UserMessageTag(models.Model):
    user = models.ForeignKey(User, related_name='user_tagged_in_message', on_delete=models.CASCADE)
    message = models.ForeignKey('Message', related_name="user_message_tagged_message", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def create_notification(self, sender_id):
        from communication_app.models import Notification
        from communication_app.utils import NotificationTypes
        discussion_board = self.message.discussion_board
        return Notification.objects.create(
            receiver_id=self.user.id,
            content=f"You were mentioned in a message: {self.message.content[0:50]}",
            source_id=sender_id,
            link=f"{reverse('auth_app:message_centre')}?discussion={discussion_board.chat_room_code}",
            type=NotificationTypes.MENTION.value
        )

    def to_json(self):
        return dict(
            message=self.message.to_json(),
            discussion_board=self.message.discussion_board.to_json(),
            research_project=self.message.discussion_board.linked_study.to_json(),
            link=f'/message_centre/?discussion={self.message.discussion_board.chat_room_code}'
        )
