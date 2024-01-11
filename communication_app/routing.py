from django.urls import path

from communication_app.consumers import CommunicationAppConsumer, NotificationsConsumer

websocket_urlpatterns = [
    path(r'ws/chat/<str:room_name>/', CommunicationAppConsumer.as_asgi()),
    path(r'ws/notifications/', NotificationsConsumer.as_asgi())
]
