import logging

from django import template
from django.contrib.auth.models import User

from auth_app.models import UserProfile
from communication_app.models import Notification

logger = logging.getLogger(__name__)
register = template.Library()


@register.filter(name='get_user_role')
def get_user_role(user_id):
    if user_id == "" or user_id is None:
        return None
    user_profile = UserProfile.objects.get(user_id=user_id)
    return user_profile.role


@register.filter(name='is_researcher_approved')
def is_researcher_approved(user_id):
    # retrieve the requested user and then check if they are first a researcher and then if they are an approved user
    if user_id == "" or user_id is None:
        return None
    user_profile = UserProfile.objects.get(user_id=user_id)

    if not user_profile.is_researcher():
        return False
    return user_profile.is_active_researcher


@register.filter
def has_unread_notifications(user: User) -> bool:
    """
    Returns true if there is at least one unread notification for the user. False otherwise.
    """
    return Notification.objects.filter(receiver=user, read_at__isnull=True).exists()
