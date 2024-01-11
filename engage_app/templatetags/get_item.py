from django import template

register = template.Library()


@register.filter
def get_item(dictionary: dict, key: str):
    """
    Retrieves value corresponding to the given key from
    the dictionary passed in.
    """
    return dictionary.get(key)


@register.filter
def display_list_as_text(string_list: list, joiner=' '):
    return joiner.join(string_list)


@register.filter
def replace_char_with_spaces(string, replaced_char):
    """Return the string with all words capitalized"""
    return string.replace(replaced_char, ' ')


@register.filter
def get_unread_notifications_count(user_id):
    from communication_app.models import Notification
    return Notification.objects.filter(receiver_id=user_id, read_at__isnull=True).count()
