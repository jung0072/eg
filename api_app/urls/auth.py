from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView
from api_app.controllers.authentication import *

urlpatterns = [
    path('login', AuthenticateUserTokenObtainPairView.as_view(), name='login_user'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout', LogoutUser.as_view(), name="logout_user"),
    path('signup', RegistrationViewAPI.as_view(), name='register_user'),
    path('retrieve_user', RetrieveUserView.as_view(), name='me'),
    path('get_city', GetCity.as_view(), name="city_data"),
    path('password_reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password_reset_confirm/', ConfirmPasswordReset.as_view(), name='password_reset_confirm'),
    path('check_password_reset_allowed/', ConfirmPasswordReset.as_view(), name='check_password_reset_allowed'),
    path('activate_user_account/', ActivateUserAccountController.as_view(), name='activate_user_account'),
    path('insight_scope_auth/', AuthWithInsightScope.as_view(), name='insight_scope_auth'),
    path('resend_activation_email/', ResendActivationEmail.as_view(), name='resend_activation_email'),
    path('check_platform_status/', CheckSignupPlatformStatus.as_view(), name='check_platform_status'),
]
