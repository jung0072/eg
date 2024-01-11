from django.urls import path

from api_app.controllers.contact_log import ContactLogController, AuthContactLogController

urlpatterns = [
    path('', ContactLogController.as_view(), name='contact_us'),
    path('auth_user/', AuthContactLogController.as_view(), name='auth_contact_us'),
    path('update/<int:contact_log_id>/', AuthContactLogController.as_view(), name='update_contact_us'),
]
