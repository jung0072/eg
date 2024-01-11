from django.db import models
from base_app.models.base_engage_model import BaseEngageModel
from django.contrib.postgres.fields import ArrayField


class BaseAnswer(BaseEngageModel):
    class Meta:
        abstract = True

    """For each user profile answer object we will have a reference to the question that was saved and the selected
    options"""
    selected_options = ArrayField(models.TextField(max_length=200), default=list)
    comment = models.TextField(default="", max_length=400)
