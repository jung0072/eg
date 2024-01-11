
import ckeditor.fields
from django.db import models
from django.contrib.auth.models import User
from engage_app.utils.constants import SystemMessageTypes


class SystemMessage(models.Model):
    author = models.ForeignKey(User, related_name='system_message_user', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    type = models.CharField(choices=SystemMessageTypes.to_list(), max_length=64, null=False)
    title = models.CharField(max_length=255, blank=False, null=False)
    content = ckeditor.fields.RichTextField(blank=False, null=False)
    is_published = models.BooleanField(default=False)
