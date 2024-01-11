import ckeditor.fields
import re
from django.contrib.auth.models import User
from django.db import models
from datetime import datetime

from django.urls import reverse

from communication_app.models import Notification
from communication_app.utils import NotificationTypes
from engage_app.utils.constants import SystemMessageTypes


class SystemMessage(models.Model):
    slug = models.CharField(max_length=64, primary_key=True, null=False, blank=False)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    type = models.CharField(choices=SystemMessageTypes.to_list(), max_length=64, null=False)
    title = models.CharField(max_length=255, blank=False, null=False)
    content = ckeditor.fields.RichTextField(blank=False, null=False)

    @property
    def url(self) -> str:
        """
        Just returns the link of the wrapper view that will mark this notification as read
        """
        return reverse('engage_app:view_system_message', args=[self.slug])

    @property
    def type_pretty_name(self) -> str:
        """
        Returns the pretty name of the selected enum type for this message
        """
        return SystemMessageTypes[self.type].value

    @staticmethod
    def auto_slug(title: str) -> str:
        """
        Used for generating a url-safe slug from a given title
        """

        # Remove some specific characters
        replaced = re.sub('[\'\"]+', '', title)

        # Replace any non-alphanumeric characters with underscores
        replaced = re.sub('[^0-9a-zA-Z]+', '_', replaced)

        # Then trim any leading or trailing underscores
        replaced = replaced.strip("_")

        # Make a data string
        date = datetime.now().strftime("%Y_%m_%d")

        # Concat those and return
        return date + "-" + replaced

    @staticmethod
    def on_post_save(sender, **kwargs):
        # We only care if the announcement is created, not updated
        if not kwargs['created']:
            return

        # Go and make a new notification for all the users
        instance: SystemMessage = kwargs['instance']
        for user in User.objects.all():
            notification = Notification.objects.create(
                receiver=user,
                source_id=0,
                content=f'{instance.title}',
                link=reverse('engage_app:view_system_message', args=[instance.slug]),
                type=NotificationTypes.SYSTEM.value
            )
            notification.save()


models.signals.post_save.connect(SystemMessage.on_post_save, sender=SystemMessage)
