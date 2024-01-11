from django.contrib.auth.models import User
from django.db import models

from base_app.models import BaseEngageModel


class ClassroomParticipants(BaseEngageModel):
    # TODO: confirm with clients if we need a permission level here?
    user = models.ForeignKey(User, related_name="%(app_label)s_%(class)s_related_user", on_delete=models.CASCADE)
    classroom = models.ForeignKey(
        'Classroom', related_name="%(app_label)s_%(class)s_related_class", on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_teacher_assistant = models.BooleanField(default=False)
    is_instructor = models.BooleanField(default=False)
    is_student = models.BooleanField(default=False)

    is_active = models.BooleanField(default=False)
    # set once the participant is active.
    join_date = models.DateTimeField(null=True, blank=True)
