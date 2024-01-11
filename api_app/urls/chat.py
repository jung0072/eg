from django.urls import path

from api_app.controllers.communication.message_centre import MessageCentreView, MessageImageAttachmentView
from api_app.controllers.communication.notifications import UserNotificationListController, \
    MarkUserNotificationsAsReadController, ReadUserNotificationController

# TODO: Migrate communication_app api views here
urlpatterns = [
    path('message_centre/', MessageCentreView.as_view(), name='message_centre'),
    path('message_centre/<int:message_id>/img/', MessageImageAttachmentView.as_view(), name='message_centre'),
    path('notifications/list/', UserNotificationListController.as_view(), name="user_notifications_list"),
    path(
        'notifications/list/read/', MarkUserNotificationsAsReadController.as_view(), name="read_all_user_notifications"
    ),
    path('read_notification/<int:notification_id>/', ReadUserNotificationController.as_view(), name="read_notification")
]
