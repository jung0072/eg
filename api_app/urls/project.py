from django.urls import path, include

from api_app.controllers.research_project import UserResearchProjectInfoController, ResearchProjectTeamInfoController, \
    ResearchProjectUserMentionsController, UserRecentResearchTasksController, ResearchProjectController, \
    ResearchProjectPartners, ResearchProjectCalendarReminderController, ResearchProjectFormController, \
    ApprovedResearchProjectController, ResearchProjectInfoController
from api_app.controllers.research_project_participant import RequestToJoinResearchProjectController, \
    AddUserToResearchProjectController, JoinResearchStudyController, ActivateNewTeamMemberController, \
    ChangeTeamMemberPermissions, DeactivateMemberController, DeactivateSelfController, DeleteMemberController, \
    PromptUserForProjectInvitationController
from api_app.controllers.research_project_task import SubmitResearchTaskController, AssignUserToResearchProjectTask, \
    ResearchProjectTaskController, FinalizeResearchTaskController, PromptUserForIncompleteTask, \
    PromptAllUsersForIncompleteTask
from api_app.controllers.research_project_file import ResearchTaskFileController, ResearchTaskCloudDocumentController, \
    ResearchProjectFileController

urlpatterns = [
    # API Views that _are not_ related to a single project.
    path('mentions/<int:project_id>/', ResearchProjectUserMentionsController.as_view(), name="all_user_mentions"),
    path('user_projects/', UserResearchProjectInfoController.as_view(), name="user_research_project_list"),
    path('user_tasks/<int:project_id>/', UserRecentResearchTasksController.as_view(), name="user_recent_tasks"),
    path('create/', ResearchProjectInfoController.as_view(), name="create_research_project"),
    path('get_active_user/<int:project_id>/', ResearchProjectPartners.as_view(), name="get_active_user"),
    path('form_data/', ResearchProjectFormController.as_view(), name="get_research_study_form_data"),
    path('research_studies/', ApprovedResearchProjectController.as_view(), name="approved_projects_list"),
    # Anything relating to a specific project should be under here
    # This keeps the named argument for the project id the same.
    path("<int:project_id>/", include([
        path("study_team/", ResearchProjectTeamInfoController.as_view(), name="study_team_info"),
        path('add_task/', ResearchProjectTaskController.as_view(), name="add_project_task"),
        path("info/", ResearchProjectInfoController.as_view(), name="research_study_info"),
        path("edit/", ResearchProjectController.as_view(), name="research_study_edit"),
        path("reminders/", ResearchProjectCalendarReminderController.as_view(), name="research_study_reminders"),

        # Paths related to project membership follow
        path("participation/", include([
            path("request_join/", RequestToJoinResearchProjectController.as_view()),
            path("add_user/", AddUserToResearchProjectController.as_view()),
            path("join/", JoinResearchStudyController.as_view()),
            path("activate/<int:user_id>/", ActivateNewTeamMemberController.as_view()),
            path("modify/<int:user_id>/", ChangeTeamMemberPermissions.as_view()),
            path("deactivate/<int:user_id>/", DeactivateMemberController.as_view()),
            path("deactivate_self/", DeactivateSelfController.as_view()),
            path("delete/<int:user_id>/", DeleteMemberController.as_view()),
            path("prompt/", PromptUserForProjectInvitationController.as_view()),
        ])),

        # Paths related to a specific research study task
        path("<int:task_id>/", include([
            path('edit_task/', ResearchProjectTaskController.as_view(), name="edit_project_task"),
            path('submit_task/', SubmitResearchTaskController.as_view(), name="submit_research_task"),
            path('assign_task/', AssignUserToResearchProjectTask.as_view(), name="assign_research_task"),
            path('upload/<str:file_type>/', ResearchTaskFileController.as_view(), name="upload_research_file"),
            path(
                'upload_cloud/<str:file_type>/', ResearchTaskCloudDocumentController.as_view(),
                name="upload_cloud_research_file"
            ),
            path('download/<int:file_id>/', ResearchTaskFileController.as_view(), name="download_task_file"),
            path('finalize_task/', FinalizeResearchTaskController.as_view(), name="finalize_research_task"),
            path('project_file/<int:file_id>/<str:file_type>/', ResearchProjectFileController.as_view(), name="task_file"),
            path('<int:user_id>/prompt_user/', PromptUserForIncompleteTask.as_view(), name="prompt_user"),
            path('prompt_all/', PromptAllUsersForIncompleteTask.as_view(), name="prompt_all_users")
        ]))
    ]))
]
