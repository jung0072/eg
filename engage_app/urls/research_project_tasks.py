from django.urls import path

from engage_app.views import research_project_task_details, upload_protocol_file, download_research_task_file, \
    assign_user_to_research_task

research_project_tasks_urls = [
    # path('task/<int:research_task_id>/details/', research_project_task_details, name='research_task_details'),
    # path('task/<int:research_task_id>/upload_protocol_file/', upload_protocol_file, name='upload_protocol_file'),
    # path(
    #     'task/download/<int:file_id>/',
    #     download_research_task_file, name='download_protocol_file'
    # ),
    # path('task/<int:research_task_id>/assign_user/', assign_user_to_research_task, name="assign_user_to_research_task")
]
