from django import template

from auth_app.models import UserProfile

register = template.Library()


@register.simple_tag
def get_profile_picture(user_id: str):
    """
    To retrieve a decoded profile picture of a user. Default avatar is
    returned if the user profile or profile picture does not exist.
    """
    return f'data:;base64,{UserProfile.get_user_profile_picture(user_id)}'
