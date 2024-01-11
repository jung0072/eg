from django.urls import path

from communication_app.views import research_project_discussion_boards, chat_room, load_discussion_board_messages, \
    add_discussion_board, delete_discussion_board

research_project_discussion_board_urls = [
    path(
        'research_project/<int:research_project_id>/task/<int:task_id>/message_boards/',
        research_project_discussion_boards,
        name='research_project_discussion_boards'
    ),
    path('research_project/<str:room_name>/', chat_room, name='research_project_chat_room'),
    path(
        'research_project/<str:room_name>/messages/', load_discussion_board_messages,
        name='load_discussion_board_messages'
    ),
    path(
        f"task/<int:research_task_id>/add_discussion_board/", add_discussion_board,
        name='add_research_task_discussion_board'
    ),
    path('discussion_board/<int:discussion_board_id>/delete/', delete_discussion_board, name="delete_discussion_board")
]
