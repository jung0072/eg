from django import forms
from django.contrib.auth.models import User
from django.db.models import Q
from django.shortcuts import reverse

from auth_app.models import UserProfile, AdminSettings
from auth_app.models.research_interest import ResearchInterestsField
from communication_app.models import Notification
from communication_app.utils import NotificationTypes
from email_app.utils import EngageEmail, EmailTemplateConstants
from engage_app.models import ResearchProject, ResearchProjectParticipant
from engage_app.utils import UserRoles, DateTypes, clean_estimated_dates, ProjectRecruitingStatus
from auth_app.utils import ADMIN_SETTINGS_NAME

class ResearchProjectForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        self.project_creator_id = kwargs.pop('project_creator_id', None)
        self.alternate_lead_id = kwargs.pop('alternate_lead', None)
        self.principal_investigators = kwargs.pop('principal_investigators', None)
        super().__init__(*args, **kwargs)

        # after initializing the form set the fields overrides, first check if we were given an instance if it is None
        if kwargs['instance'] is not None:
            self.fields['roles_needed'].initial = list(kwargs['instance'].roles_needed)

    class Meta:
        model = ResearchProject
        fields = [
            'title', 'reference_name', 'description', 'research_interests',
            'start_date', 'start_date_type', 'is_using_start_date', 'end_date', 'end_date_type',
            'is_using_end_date', 'icu_city', 'icu_country', 'partner_commitment_description',
            'roles_needed', 'contact_email', 'linkedin_link', 'twitter_link', 'facebook_link',
            'instagram_link', 'research_gate_link', 'website_link', 'is_contact_visible',
            'main_contact', 'centre_format', 'type', 'study_format', 'has_specific_team_demographics',
            'participant_demographics_type', 'has_social_media_links', 'recruiting_status', 'is_complete',
            'is_public', 'is_archived'
        ]
        widgets = {
            'title': forms.TextInput(),
            'icu_city': forms.Select(),
            'icu_country': forms.Select(),
            'start_date': forms.DateInput(attrs={'type': 'date'}),
            'start_date_type': forms.RadioSelect(choices=DateTypes.to_list()),
            'end_date': forms.DateInput(attrs={'type': 'date'}),
            'end_date_type': forms.RadioSelect(choices=DateTypes.to_list()),
            'roles_needed': forms.CheckboxSelectMultiple(choices=UserRoles.to_list()),
            'partner_commitment_description': forms.TextInput(attrs={'placeholder': 'eg. 2 hours every 2 weeks'}),
            'research_interests': ResearchInterestsField,
        }

    def clean(self):
        cleaned_data = super().clean()
        cleaned_data = clean_estimated_dates(cleaned_data, 'is_using_start_date', 'start_date_type', 'start_date')
        cleaned_data = clean_estimated_dates(cleaned_data, 'is_using_end_date', 'end_date_type', 'end_date')
        return cleaned_data

    def save(self, commit=True):
        research_project = super().save(commit=False)
        if commit:
            # Query the AdminSettings model for the specific setting by its name
            # if admin approval is not required for project then set is_approved to True
            project_approval_setting = AdminSettings.objects.get(name=ADMIN_SETTINGS_NAME.APPROVAL_REQUIRED_FOR_PROJECTS.value)
            if project_approval_setting.bool_value is False:
                research_project.is_approved = True
                research_project.is_ready_for_review = False
            # Set the creator id before saving the research project
            research_project.creator_id = self.project_creator_id

            # set recruiting status to close if project is archived
            if research_project.is_archived:
                research_project.recruiting_status = ProjectRecruitingStatus.CLOSED.name

        research_project.save()
        project_participants = ResearchProjectParticipant.objects.filter(study_id=research_project.id)

        # set the participant archive status to be the same as project archive 
        for participant in project_participants:
            if research_project.is_archived != participant.is_archived:
                participant.is_archived = research_project.is_archived
                participant.save()

        # If they have specified an alternate project lead then add them to the team
        if self.alternate_lead_id:
            if not project_participants.filter(user_id=self.alternate_lead_id).exists():
                ResearchProjectParticipant.add_user_to_team(
                    user_id=self.alternate_lead_id, study_id=research_project.id, is_patient_partner=False,
                    is_active=True, is_lead=True, is_archived=research_project.is_archived
                )

        # If they have specified principal investigators add them (apply Case 1) to the team and send a notification
        participant_objs = []

        if self.principal_investigators:
            for user_id in self.principal_investigators:
                if not project_participants.filter(user_id=user_id).exists():
                    participant = ResearchProjectParticipant(
                        user_id=user_id,
                        study_id=research_project.id,
                        is_principal_investigator=True,
                        is_active=False,
                        is_approved=True,
                        is_archived=research_project.is_archived,
                    )
                    participant_objs.append(participant)

            if participant_objs:
                ResearchProjectParticipant.objects.bulk_create(participant_objs)

        # create params for sending an email and get active user on project
        project_params = {
            'to_users': User.objects.get(id=self.project_creator_id),
            'active_users': ResearchProjectParticipant.get_project_active_user(research_project.id),
            'link': reverse('auth_app:react_project_details', args=[research_project.id]),
            'project': ResearchProject.objects.get(id=research_project.id)
        }

        # After saving the project, email the project creator as well as to the admin
        cc_users = []
        for carbon_users in project_params["active_users"]:
            if carbon_users["email"] != project_params['to_users'].email:
                cc_users.append(carbon_users["email"])

        email = EngageEmail(subject=f'Engage | {EmailTemplateConstants.SUBJECT_REQUEST_APPROVAL}',
                            template_name=EmailTemplateConstants.REQUEST_FOR_PROJECT_APPROVAL,
                            template_params=project_params)
        email.set_recipients(to=project_params["to_users"].email, cc=cc_users)
        email.send()

        current_admins = list(User.objects.filter(is_superuser=True).values_list('email', flat=True))
        project_params['link'] = reverse('auth_app:react_project_details', args=[research_project.id])
        email_admin = EngageEmail(subject=f'Engage | {EmailTemplateConstants.SUBJECT_ADMIN_REQUEST_APPROVAL}',
                                  template_name=EmailTemplateConstants.ADMIN_REQUEST_FOR_APPROVAL,
                                  template_params=project_params)
        email_admin.build_template_params()
        email_admin.set_recipients(current_admins)
        email_admin.send()
        return research_project


class AddNewTeamMemberToProjectForm(forms.Form):
    user_id = forms.ModelChoiceField(
        empty_label='No Selection',
        label="New Team Member",
        queryset=None
    )

    def __init__(self, *args, **kwargs):
        self.study_id = kwargs.pop('study_id', None)
        self.is_archived = kwargs.pop('is_archived', None)
        super().__init__(*args, **kwargs)

        # Update the user id field names to be the users full name and their role on the site
        self.fields['user_id'].label_from_instance = lambda obj: f'{obj.user.get_full_name()} - {obj.role.title()}'

        # retrieve all the team members of the current project, then get all the valid profiles excluding team
        current_team_members = ResearchProjectParticipant.objects.filter(study_id=self.study_id).values_list(
            'user_id', flat=True
        )
        valid_user_profiles = UserProfile.objects.filter(
            Q(is_active_researcher=True) | Q(role__in=UserRoles.get_patient_partner_types())
        ).exclude(user_id__in=current_team_members)
        self.fields['user_id'].queryset = valid_user_profiles

    def save(self, study_id):
        # Use the validated form data to add this user to the research project team as an inactive user
        data = self.cleaned_data
        new_team_member_id = data['user_id'].user.id
        ResearchProjectParticipant.add_user_to_team(
            is_patient_partner=True, study_id=study_id, user_id=new_team_member_id, is_active=False,
            is_approved=True, is_archived=self.is_archived
        )

        # Send a notification to this user telling them they have been added to the project
        Notification.objects.create(
            receiver_id=new_team_member_id,
            source_id=study_id,
            content=f'You have been invited to join a research project. Access the project page and click Join '
                    f'Project to accept the invite',
            link=reverse('auth_app:react_project_details', args=[study_id]),
            type=NotificationTypes.PROJECT.value
        )
