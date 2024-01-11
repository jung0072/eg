from django.contrib.auth.views import LogoutView
from django.urls import path
from django.views.defaults import page_not_found, server_error
from django.shortcuts import render

from auth_app.views import approve_researcher, administration_home, get_user_profile_questions_and_sections, \
    get_system_user_profile_information, get_research_interests_information, get_pending_researchers, \
    get_pending_projects, approve_project, get_research_projects, delete_project, change_user_password, \
    change_user_role
from api_app.controllers.authentication import activate_user_account, home, react_app_user_page, \
    react_app_research_project_page, react_app_research_project_task_page, react_app_research_project_form \
    , react_app_research_project_page, react_app_research_project_task_page, react_app_research_project_form, \
    reset_password_confirm, faq_question, system_message, react_app_platform_signup, activate_educate_user_account


def custom_404(request, exception):
    return render(request, exception, template_name="404.html", status=404)

def custom_403(request, exception):
    return render(request, exception, template_name="403.html", status=404)

handler404 = custom_404
handler403 = custom_403

auth_urls = [
    # Urls needed for the React Application
    path('', home, name='home'),
    path('home/', home, name='home'),
    path('projects/', home, name='projects'),
    path('community/', home, name='community'),
    path('community/edi/', home, name='edi_info'),
    path('community/personalization/', home, name='personalization'),
    path('community/demographic/', home, name='demographic_info'),
    path('community/project_member_view/', home, name='project_member_view'),
    path('notifications/', home, name='notifications'),
    path('registration/', home, name='registration'),
    path('message_centre/', home, name='message_centre'),
    path('edit_profile/', home, name='edit_user_profile'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('admin-panel/', home, name='admin_panel'),
    path('activated/', home, name='activated_account'),
    path('reset_password_confirm/<uidb64>/<token>/', reset_password_confirm, name='reset_password_confirm'),
    path('faq_list/', home, name='faq_list'),
    path('faq_question/<int:question_id>/', faq_question, name='question'),
    path('app/faq_list/', home, name='faq_list'),
    path('app/faq_question/<int:question_id>/', faq_question, name='faq_question'),
    path('activate_user/<str:access>/', activate_user_account, name="activate_user"),
    path('register_from_platform/<str:platform>/', react_app_platform_signup, name="register_from_platform"),
    path('app/user/<int:user_id>/', react_app_user_page, name="react_user_profile"),
    path('app/contact_us/', home, name='auth_contact_us'),
    path('app/contact_us/system_issue/', home, name='auth_system_issue'),
    path('contact_us/', home, name='contact_us'),
    path('contact_us/system_issue/', home, name='system_issue'),
    path('about_us/', home, name='about_us'),
    path('app/privacy_policy/', home, name='auth_privacy_policy'),
    path('app/tos/', home, name='auth_tos'),
    path('app/notification_settings/', home, name='auth_notification_settings'),
    path('privacy_policy/', home, name='privacy_policy'),
    path('tos/', home, name='tos'),
    path('notification_settings/', home, name='notification_settings'),
    path('app/research_study/<int:research_project_id>/', react_app_research_project_page, name="react_project_details"),
    path('app/research_task/<int:research_project_task_id>/', react_app_research_project_task_page, name="react_project_task_details"),
    path('app/research_study_form/', react_app_research_project_form, name="react_research_project_form"),
    path(
        'app/research_study_form/<int:research_project_id>/',
        react_app_research_project_form,
        name="react_research_project_edit_form"
    ),
    path('system_message/', home, name='system_message'),
    path('system_message/<int:message_id>/', system_message, name='system_message'),

    # Admin urls
    path('app/engage_reports/', home, name='engage_reports'),

    # path related to educate
    path('activate_educate_user/<str:access>/', activate_educate_user_account, name="activate_educate_user"),

]
