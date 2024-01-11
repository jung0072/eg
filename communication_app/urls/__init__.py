from communication_app.urls.discussion_boards import research_project_discussion_board_urls
from communication_app.urls.notifications import notification_urls

app_name = 'communication_app'

urlpatterns = [
    *research_project_discussion_board_urls,
    *notification_urls,
]
