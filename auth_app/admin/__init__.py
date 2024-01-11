from django.contrib import admin
from auth_app.models import UserProfileQuestion, UserProfileSection
from auth_app.admin.user_profile_question_admin import UserProfileQuestionAdmin
from auth_app.admin.user_profile_section_admin import UserProfileSectionAdmin

# Register your models here.
# TODO: refactor this under a more appropriate app if applicable

admin.site.register(UserProfileQuestion, UserProfileQuestionAdmin)
admin.site.register(UserProfileSection, UserProfileSectionAdmin)