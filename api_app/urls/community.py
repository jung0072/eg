from django.urls import path

from api_app.controllers.community import CommunityListFiltersController

urlpatterns = [
    path('filters/', CommunityListFiltersController.as_view(), name="community_list_filters"),
]
