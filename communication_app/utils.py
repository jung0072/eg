from engage_app.utils.constants import ListEnum


class MessageTypes(ListEnum):
    USER = "User to User"
    SYSTEM = "System to User"
    DISCUSSION = "Discussion Board"


class NotificationTypes(ListEnum):
    USER = "User Message"
    SYSTEM = "System Message"
    DISCUSSION = "Discussion Board"
    PROJECT = "Research Project"
    ACCOUNT = "Account"
    MENTION = "Mentioned in Comment"

background_notifications_unread_categories = [NotificationTypes.SYSTEM.value, NotificationTypes.PROJECT.value, NotificationTypes.MENTION.value]
