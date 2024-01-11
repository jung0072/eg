from django import forms

from engage_app.models import ResearchProjectParticipant, ResearchProjectTaskAssignedUser
from auth_app.models import UserProfile


class ResearchProjectTaskAssignUserForm(forms.Form):
    user = forms.ModelChoiceField(
        empty_label='No Selection',
        label="Assigned Team Member",
        queryset=None
    )

    def __init__(self, *args, **kwargs):
        self.current_user_id = kwargs.pop('current_user_id', None)
        self.research_project_id = kwargs.pop('research_project_id', None)
        self.research_project_task_id = kwargs.pop('research_project_task_id', None)
        super().__init__(*args, **kwargs)

        project_participants = ResearchProjectParticipant.objects.filter(
            study_id=self.research_project_id, is_active=True
        )
        current_assigned_users = ResearchProjectTaskAssignedUser.objects.filter(
            research_project_task_id=self.research_project_task_id
        )
        unassigned_project_participants = project_participants.exclude(
            user_id__in=current_assigned_users.values_list('assigned_user_id', flat=True)
        )
        self.fields['user'].queryset = UserProfile.objects.filter(
            user_id__in=unassigned_project_participants.values_list('user_id', flat=True)
        )

    def save(self, commit=True):
        if commit:
            # For each user submitted assign the user to the task
            data = self.cleaned_data
            assigned_team_member_id = data['user'].user.id

            current_assigned_users = ResearchProjectTaskAssignedUser.objects.filter(
                research_project_task_id=self.research_project_task_id
            )
            # check if the team member is already assigned and we can ignore this user
            if current_assigned_users.filter(assigned_user_id=assigned_team_member_id).exists():
                return current_assigned_users.first()
            return ResearchProjectTaskAssignedUser.assign_user_to_task(
                self.research_project_task_id, assigned_team_member_id
            )
