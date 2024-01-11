from django.urls import path

from api_app.controllers.system_message import SystemMessageController

urlpatterns = [
    path('', SystemMessageController.as_view(), name='system_messages'),
    path('<int:message_id>/', SystemMessageController.as_view(), name='system_messages')
]
