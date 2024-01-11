import string
from django import forms

from django.contrib.auth.password_validation import validate_password


class AuthenticationForm(forms.Form):

    def to_json(self):
        if self.is_valid():
            return self.cleaned_data
        else:
            return dict(error="This Form did not contain valid input")


class CustomPasswordResetConfirmForm(forms.Form):

    encoded_user_id = forms.CharField(label='encoded_user_id')
    token = forms.CharField(label='user_token')
    new_password1 = forms.CharField(label="new_password1", validators=[validate_password])
    new_password2 = forms.CharField(label="new_password1")

    def __init__(self, *args, **kwargs):
        super(CustomPasswordResetConfirmForm, self).__init__(*args, **kwargs)
        self.fields['encoded_user_id'].required = True
        self.fields['token'].required = True
        self.fields['new_password1'].required = True
        self.fields['new_password2'].required = True

    def clean(self):
        cleaned_data = super(CustomPasswordResetConfirmForm, self).clean()
        new_password1 = cleaned_data.get("new_password1")
        new_password2 = cleaned_data.get("new_password2")

        if new_password1 and new_password2 and new_password1 != new_password2:
            self._errors['new_password2'] = self.error_class(["The two password fields didn’t match."])

        return cleaned_data
