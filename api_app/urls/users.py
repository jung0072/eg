from django.urls import path

from api_app.controllers.users import *

urlpatterns = [
    path('query/', query_users),
    path('directory_preview/', user_directory_preview),
    path('info/<int:user_id>/', UserProfileInfoController.as_view(), name="user_profile_details"),
    path('check_profile/', UserProfileCompletionCheckController.as_view(), name="user_profile_check"),
    path('edit_profile/submit/', EditUserProfileController.as_view(), name="edit_user_profile"),
    path('form_data/', UserProfileFormController.as_view(), name="user_profile_form_data"),
    path('profile_picture/<int:user_id>', UserProfilePictureController.as_view(), name="user_profile_picture"),
    path('archive_project/', ArchiveUserProjectController.as_view(), name="archive_user_project"),
]
