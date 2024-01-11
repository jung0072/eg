from django.contrib.auth.models import User
from django.db import models


class BaseCreatable(models.Model):
    """
    Base abstract class for a model that can be created and updated on the system.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    """The timestamp of when this model was created on the system."""
    updated_at = models.DateTimeField(auto_now=True)
    """The timestamp of when this model was last updated on the system."""
    created_by = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name="+")
    """The user that originally created this model."""

    class Meta:
        abstract = True
