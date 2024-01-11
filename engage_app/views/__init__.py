from engage_app.views.research_project import add_project, modify_research_project, research_project_info, \
    research_project_settings_form, add_research_project_task, get_user_projects_list, add_user_to_team, \
    request_to_join_project, join_research_study, activate_new_team_member, remove_team_member
from engage_app.views.research_project_task import research_project_task_details, upload_protocol_file, \
    download_research_task_file, assign_user_to_research_task
from engage_app.views.system_messages import view_system_message, edit_system_message, create_system_message, \
    delete_system_message
from engage_app.views.user_profile import modify_user_profile, get_user_profile_questions_json, \
    display_user_profile, request_engage_user_data, get_public_user_profile_image
from engage_app.views.views import research_project_details, research_projects_list, researcher_directory_list, \
    patient_directory_list, get_user_list, city_list, upload_user_photo
