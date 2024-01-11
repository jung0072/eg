from django.contrib.auth.models import User
from django.db import models
from django.urls import reverse

from communication_app.utils import NotificationTypes
from engage_app.models import ResearchProject


class Notification(models.Model):
    receiver = models.ForeignKey(User, related_name='notification_receiver', on_delete=models.CASCADE)
    source_id = models.IntegerField(null=True)
    content = models.CharField(max_length=500)
    type = models.TextField(max_length=255, choices=NotificationTypes.to_list())
    # will be used for redirects to different portions of the site
    link = models.URLField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True)

    def to_json(self):
        return dict(
            source_name=self.source_name,
            source_id=self.source_id,
            content=self.content,
            type=self.type,
            link=self.wrapper_url,
            created_at=str(self.created_at),
            read_at=str(self.read_at),
            id=self.id
        )

    @property
    def wrapper_url(self) -> str:
        """
        Just returns the link of the wrapper view that will mark this notification as read
        """
        return reverse('api_app:read_notification', args=[self.id])

    @property
    def source_name(self) -> str:
        """
        Depending on the type of the notification, the source could be something other than a user.
        This function returns the name of the source, whether that be a user, or discussion board, etc.
        """
        from communication_app.models import DiscussionBoard

        if self.type == NotificationTypes.DISCUSSION.value:
            # Get the name of the discussion board
            discussion_board = DiscussionBoard.objects.get(id=self.source_id)
            # TODO: Change this to the TITLE when that is implemented
            return discussion_board.description
        elif self.type == NotificationTypes.PROJECT.value:
            project = ResearchProject.objects.get(id=self.source_id)
            return project.title
        elif self.type == NotificationTypes.SYSTEM.value:
            return "System Message"
        elif self.type == NotificationTypes.USER.value or self.type == NotificationTypes.MENTION.value:
            user = User.objects.get(id=self.source_id)
            return user.get_full_name()
        else:
            return ''
