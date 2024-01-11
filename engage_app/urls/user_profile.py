from django.urls import path

from engage_app.views import get_public_user_profile_image
from engage_app.views.controllers.user_profile_controller import UserProfileController

user_profile_urls = [
    # TODO: Implement the basic profile page where a user can view their info after form saving/ validating
    # path('profile/<int:user_id>/', display_user_profile, name='display_user_profile'),
    # path('profile/upload_photo/', upload_user_photo, name='upload_user_photo'),
    # path('profile/settings/', user_profile_settings, name='user_profile_settings'),
    # path('profile/edit/', modify_user_profile, name='edit_user_profile'),
    # path('profile/edit/form/', get_user_profile_questions_json, name='user_profile_form'),
    path('profile/<str:username>/image/', get_public_user_profile_image, name='get_public_profile_picture'),
    # path('request_user_data/', request_engage_user_data, name="request_user_data") #not needed anymore as we dont have to make a request to get data
    path('user_profile/', UserProfileController.as_view(), name='update_profile')
]
