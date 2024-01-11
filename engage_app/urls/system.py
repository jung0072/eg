from django.urls import path

from engage_app.views import view_system_message, edit_system_message, create_system_message, delete_system_message

system_urls = [
    path('system_message/view/<str:slug>/', view_system_message, name='view_system_message'),
    path('system_message/edit/<str:slug>/', edit_system_message, name='edit_system_message'),
    path('system_message/create/', create_system_message, name='create_system_message'),
    path('system_message/delete/<str:slug>/', delete_system_message, name='delete_system_message'),
]
