from django.urls import path, include

from api_app.controllers.admin import PendingResearchers, PendingResearchProjectController, UserManagement, \
    ResetUserPasswordAdmin, ProjectManagement, GetChatLogs, SystemSettingsManagement, CustomizeUserProfileQuestions, \
    UserProfileQuestionController, AdminResearchInterestsFormManagementController, AdminActivateUserController, \
    AdminResearchInterestOptionsController, EngageReportController

urlpatterns = [
    path('pending_researchers/', PendingResearchers.as_view(), name='pending_researchers'),
    path('pending_research_project/', PendingResearchProjectController.as_view(), name="pending_research_studies"),
    path('user_management/', UserManagement.as_view(), name="user_management"),
    path('reset_user_password/<int:user_id>/', ResetUserPasswordAdmin.as_view(), name="reset_user_password"),
    path('user_questions/', CustomizeUserProfileQuestions.as_view(), name="customize_user_profile_questions"),
    path(
        'user_questions/details/<str:question_id>/',
        UserProfileQuestionController.as_view(),
        name="user_profile_question_details"
    ),
    path(
        'user_questions/create/',
        UserProfileQuestionController.as_view(),
        name="create_user_profile_question"
    ),
    path('project_management/', ProjectManagement.as_view(), name="project_management"),
    path('chat_data/<int:project_id>', GetChatLogs.as_view(), name="chat_data"),
    path('system_settings/', SystemSettingsManagement.as_view(), name="system_settings"),
    path('activate_user/<int:user_id>/', AdminActivateUserController.as_view(), name="admin_activate_user"),
    path("engage_reports/", include([
        path('', EngageReportController.as_view(), name='engage_reports'),
        path('<int:report_id>/', EngageReportController.as_view(), name='engage_reports_id'),
    ])),
    path(
        'research_interest_categories/',
        AdminResearchInterestsFormManagementController.as_view(),
        name="research_interests_category_form"
    ),
    path(
        'research_interest_categories/<int:category_id>/',
        AdminResearchInterestsFormManagementController.as_view(),
        name="research_interests_category_form"
    ),
    path(
        'research_interest_options/<int:category_id>/',
        AdminResearchInterestOptionsController.as_view(),
        name="research_interest_option_form"
    ),
]
