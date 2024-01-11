from django import forms
from django.contrib.auth.models import User

from auth_app.models import UserProfile
from auth_app.models.research_interest import ResearchInterestsField
from auth_app.utils import EDITypes

from django_select2.forms import ModelSelect2Widget
from cities_light.models import City


class UserProfileForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # self.fields['first_language'].empty_label = None
        # self.fields['most_used_language'].empty_label = None
        self.fields['role'].empty_label = None
        # self.fields['first_language'] = forms.MultipleChoiceField(
        #     choices=EDITypes.LANGUAGE.to_list(), widget=forms.CheckboxSelectMultiple,
        #     label=self.fields['first_language'].label
        # )
        # self.fields['most_used_language'] = forms.MultipleChoiceField(
        #     choices=EDITypes.LANGUAGE.to_list(), widget=forms.CheckboxSelectMultiple,
        #     label=self.fields['most_used_language'].label
        # )

        # Making the EDI Fields required as per client request
        # self.fields['gender'].required = True
        # self.fields['sexual_orientation'].required = True
        # self.fields['is_identified_native'].required = True
        # self.fields['is_visible_minority'].required = True
        # self.fields['population_group'].required = True
        # self.fields['has_disability'].required = True
        # self.fields['first_language'].required = True
        # self.fields['most_used_language'].required = True
        # self.fields['date_of_birth'].required = False

    class Meta:
        model = UserProfile
        fields = [
            'role', 'linkedin_link', 'twitter_link', 'facebook_link', 'instagram_link', 'research_gate_link',
            'experience',
        ]
        # labels = {
        #     'most_used_language': "What language(s) do you speak most often at home? (Select all that apply)",
        #     'first_language': 'What languages did you first learn at home in childhood and still understand? (Select all that apply)',
        #     'has_disability': 'Do you identify as a person with a disability as described in the Act?',
        #     'population_group': 'Select the population groups you identify with',
        #     'is_visible_minority': 'Do you identify as a member of a visible minority in Canada?',
        #     'is_identified_native': 'Do you identify as Indigenous, that is, First Nation (North American Indian), '
        #                             'Métis or Inuk (Inuit)?',
        #     'sexual_orientation': 'Select the sexual orientation that best describes how you currently think of yourself ',
        #     'gender': 'Select the option that best describes your current gender identity',
        #     'experience': 'ICU experience',
        #     'edi_answers_public': 'Allow your personal data to be visible to other users'
        # }
        # help_texts = {
        #     'has_disability': 'The <a href="https://laws-lois.justice.gc.ca/eng/acts/A-0.6/">Accessible Canada Act</a> '
        #                       'defines disability as “any impairment, including a physical, mental, intellectual, cognitive, '
        #                       'learning, communication or sensory impairment—or a functional limitation—whether permanent, '
        #                       'temporary or episodic in nature, or evident or not, that, in interaction with a barrier, '
        #                       'hinders a person’s full and equal participation in society.',
        #     'is_visible_minority': 'The <a href=https://laws-lois.justice.gc.ca/eng/acts/E-5.401/?wbdisable=false>'
        #                            'Employment Equity Act</a> defines visible minorities as “persons, other than '
        #                            'Aboriginal peoples, who are non-Caucasian in race or non-white in colour.”',
        #     'population_group': 'Note: if you answered “Yes” to question 4a (i.e., you are an Indigenous person), select'
        #                         ' “Population group not listed above” for this question. You can also select from the '
        #                         'list any other population group that applies to you.'
        # }
        widgets = {
            # commented out for testing without research interest
            # 'research_interests': ResearchInterestsField,
            'user_location': ModelSelect2Widget(
                model=City,
                queryset=City.objects.filter(country__slug='canada'),
                search_fields=['name__icontains']
            ),
            'icu_location': ModelSelect2Widget(
                model=City,
                queryset=City.objects.filter(country__slug='canada'),
                search_fields=['name__icontains']
            )
        }

    def save(self, user_id=None):
        # Save the user profile using the generic model form save method and then append the
        # user before saving to the database and returning the new user profile instance
        user_profile = super().save(commit=False)
        if user_id:
            user_profile.user = User.objects.get(id=user_id)
        user_profile.save()
        return user_profile
