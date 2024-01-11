from django.urls import path

from communication_app.views.notifications import view_notifications, read_notification, notifications_json

notification_urls = [
    # path('notifications/', view_notifications, name='view_notifications'),
    # path('read_notification/<int:notification_id>/', read_notification, name='read_notification'),
    # path('notifications/json/', notifications_json, name='notifications_json'),
]
