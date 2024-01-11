from django.urls import path

from api_app.controllers.research_project_task import ResearchTaskController

urlpatterns = [
    path('<int:research_task_id>/', ResearchTaskController.as_view(), name="task_details_page")
]
