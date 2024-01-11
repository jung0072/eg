from django.contrib.auth.models import User
from django.db import models


class BaseApprovable(models.Model):
    """
    Base abstract class for a model that requires approval on the system.
    """

    approved_at = models.DateTimeField(null=True)
    """The timestamp of when this model was approved for the system, or NULL if not approved yet."""
    approved_by = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name="+")
    """The user that approved this model for the system, or NULL if not approved yet."""

    class Meta:
        abstract = True
