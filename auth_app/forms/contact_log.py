from django import forms
from auth_app.models import ContactLog


class ContactUsForm(forms.ModelForm):
    class Meta:
        model = ContactLog
        fields = '__all__'
