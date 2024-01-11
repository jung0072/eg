from django.urls import path, include

from educate_app.controllers.classroom_builder import ClassroomBuilder
from educate_app.controllers.classroom_participants import ClassroomUserManagement

urlpatterns = [
    path('classrooms_info/', ClassroomBuilder.as_view(), name='classrooms_info'),
    path('<int:classroom_id>/', include([
        path('info/', ClassroomBuilder.as_view(), name='classroom_info'),

        path('participation/', include([
            path('user_management/', ClassroomUserManagement.as_view(), name='add_classroom_user'),
            path('user_management/<int:user_id>/', ClassroomUserManagement.as_view(), name='add_classroom_user'),
        ])),

    ])),
]
