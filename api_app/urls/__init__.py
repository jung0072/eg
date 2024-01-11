from django.urls import path, include

app_name = 'api_app'

urlpatterns = [
    path('admin/', include('api_app.urls.admin')),
    path('user/', include('api_app.urls.users')),
    path('auth/', include('api_app.urls.auth')),
    path('chat/', include('api_app.urls.chat')),
    path('data/', include('api_app.urls.data')),
    path('project/', include('api_app.urls.project')),
    path('task/', include('api_app.urls.project_task')),
    path('contact_us/', include('api_app.urls.contact_log')),
    path('community/', include('api_app.urls.community')),
    path('faq/', include('api_app.urls.faq')),
    path('system_message/', include('api_app.urls.system_message')),
]
