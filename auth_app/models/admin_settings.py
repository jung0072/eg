from django.db import models
from auth_app.utils import ADMIN_SETTINGS_TYPE


class AdminSettings(models.Model):
    name = models.TextField(unique=True)
    data_type = models.CharField(choices=ADMIN_SETTINGS_TYPE.to_list(), default=ADMIN_SETTINGS_TYPE.TEXT, max_length=10)
    text_value = models.TextField(blank=True)
    bool_value = models.BooleanField(default=True)
    int_value = models.BigIntegerField(default=0)
    date_value = models.DateTimeField(blank=True, null=True)
    select_options = models.JSONField(default=list)
    selected_value = models.TextField(blank=True)
