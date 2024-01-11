from django import template

register = template.Library()


@register.simple_tag
def is_edit_permissions_allowed(current_user, current_user_permissions, member):
    """Checks if the logged-in user has privileges to edit permissions of a team member"""
    return member.user.id != current_user.id and (current_user_permissions and current_user_permissions.is_edit_permissions_allowed)
