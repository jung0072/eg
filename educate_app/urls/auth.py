from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView
from educate_app.controllers.authentication import RegistrationViewAPI, LoginView, RetrieveUserView

urlpatterns = [
    path('signup', RegistrationViewAPI.as_view(), name='register_user'),
    path('login', LoginView.as_view(), name='login_user'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('retrieve_user', RetrieveUserView.as_view(), name='retrieve_user'),
]
