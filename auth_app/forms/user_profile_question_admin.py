from django import forms
from django.contrib import admin
from auth_app.models import UserProfileQuestion


class UserProfileQuestionForm(forms.ModelForm):
    class Meta:
        model = UserProfileQuestion
        fields = [
            'parent_question', 'section', 'order_number', 'type', 'is_required_researcher', 'is_required_patient',
            'is_required_family_of_patient', 'is_required_passive', 'text_for_researcher', 'text_for_patient',
            'text_for_family_of_patient', 'text_for_caretaker_of_patient', 'text_for_passive', 'help_text', 'dev_code'
        ]
