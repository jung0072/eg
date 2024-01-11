from django.urls import path

from engage_app.views.all_projects_list_view import AllProjectsListView
from engage_app.project_details_view import test
from engage_app.views import research_projects_list, research_project_details, add_project, \
    modify_research_project, research_project_info, city_list, research_project_settings_form, \
    add_research_project_task, get_user_projects_list, add_user_to_team, request_to_join_project, join_research_study, \
    activate_new_team_member, remove_team_member
from engage_app.views.research_project import save_permissions, delete_team_member

views_urls = [
    path('all-projects', AllProjectsListView.as_view(), name='all_projects'),
    path('city_list/', city_list, name="city_list"),
]

research_project_urls = [
    # path(
    #     'research_projects/<str:research_study_id>/details/', research_project_details, name='research_project_details'
    # ),
    # path('research_projects/', research_projects_list, name='all_research_projects'),
    #
    # path('project_view/', test, name='project_view'),
    # path('research_projects/add_project/', add_project, name='add_project'),
    # path('research_projects/<int:research_project_id>/edit_project/', add_project, name='edit_project'),
    # path(
    #     'research_projects/<int:research_project_id>/form/', modify_research_project, name='edit_research_project_form'
    # ),
    # path(
    #     'research_projects/<int:research_project_id>/settings/', research_project_settings_form,
    #     name="modify_research_project_settings"
    # ),
    # path('research_project/<int:research_project_id>/', research_project_info, name="research_project_info"),
    # path(
    #     'research_project/<int:research_project_id>/add_task/', add_research_project_task,
    #     name="add_research_project_task"
    # ),
    # path('research_project/my_projects/', get_user_projects_list, name="my_projects"),
    # path('research_project/add_team_member/<int:research_project_id>/', add_user_to_team, name="add_team_member"),
    # path(
    #     'research_project/request_to_join/<int:research_project_id>/',
    #     request_to_join_project, name="request_to_join_project"
    # ),
    # path('research_project/join/<int:research_project_id>/', join_research_study, name="request_to_join_project"),
    # path(
    #     'research_project/<int:research_project_id>/activate_user/<int:new_team_member_id>/', activate_new_team_member,
    #     name="activate_new_team_member"
    # ),
    # path(
    #     'research_project/<int:research_project_id>/remove_team_member/<int:member_id>/',
    #     remove_team_member, name="remove_team_member"
    # ),
    # path(
    #     'research_project/<int:research_project_id>/delete_team_member/<int:member_id>/',
    #     delete_team_member, name="delete_team_member"
    # ),
    # path('research_project/<int:research_project_id>/save_permissions/', save_permissions, name="save_permissions"),
]
