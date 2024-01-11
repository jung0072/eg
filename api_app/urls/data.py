from django.urls import path

from api_app.controllers.calendar_reminder import CalendarReminderController
from api_app.controllers.data import GetCanadianCitiesView, ResearchInterestsController
from api_app.controllers.community import CommunityListController

urlpatterns = [
    path('cities/', GetCanadianCitiesView.as_view()),
    path('community/', CommunityListController.as_view()),
    path('research_interests/', ResearchInterestsController.as_view()),
    path('calendar_reminder_types/', CalendarReminderController.as_view()),
]
