from engage_app.urls.research_projects import research_project_urls, views_urls
from engage_app.urls.user_profile import user_profile_urls
from engage_app.urls.partner_directory import partner_directory_urls
from engage_app.urls.system import system_urls
from engage_app.urls.research_project_tasks import research_project_tasks_urls

app_name = 'engage_app'

urlpatterns = [
    # *views_urls,
    # *research_project_urls,
    *user_profile_urls,
    # *partner_directory_urls,
    # *system_urls,
    # *research_project_tasks_urls
]
