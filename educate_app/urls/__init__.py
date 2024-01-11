from django.urls import path, include

app_name = 'educate_app'

urlpatterns = [
    path('auth/', include('educate_app.urls.auth')),
    path('classrooms/', include('educate_app.urls.classroom')),
]
