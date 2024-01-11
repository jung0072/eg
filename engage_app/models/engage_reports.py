from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

from engage_app.utils import EngageReportTypes


class EngageReports(models.Model):
    reporter = models.ForeignKey(User, related_name="engage_report_creator", on_delete=models.CASCADE)
    user_comment = models.TextField(blank=True, null=True)
    report_type = models.CharField(choices=EngageReportTypes.to_list(), max_length=64, null=False, blank=False)
    is_resolved = models.BooleanField(default=False, blank=False, null=False)
    admin_comments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # GenericForeignKey for dynamic referencing
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    reported_instance = GenericForeignKey()
