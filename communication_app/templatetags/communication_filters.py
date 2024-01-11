from django import template

register = template.Library()


@register.filter
def can_edit_discussion_board(discussion_board, user_id):
    """
    Check if the current user can modify this discussion board
    """
    return discussion_board.user_can_modify_board(user_id=user_id)
