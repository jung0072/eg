from django.contrib import admin
from auth_app.models import UserProfileQuestion


class UserProfileQuestionAdmin(admin.ModelAdmin):
    fields = [
        'description', 'is_valid_researcher', 'is_valid_patient', 'is_valid_family_member', 'is_valid_passive',
        'is_published'
    ]
