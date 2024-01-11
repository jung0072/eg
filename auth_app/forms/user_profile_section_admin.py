from django import forms
from django.contrib import admin
from auth_app.models import UserProfileSection


class UserProfileSectionForm(forms.ModelForm):
    class Meta:
        model = UserProfileSection
        fields = [
            'name', 'description', 'is_valid_researcher', 'is_valid_patient', 'is_valid_family_of_patient',
            'is_valid_passive', 'is_valid_caretaker_of_patient', 'is_published', 'order_number'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 6})
        }
