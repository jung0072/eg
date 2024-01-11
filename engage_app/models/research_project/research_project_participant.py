from django.db import models
from django.contrib.auth.models import User
from base_app.models import BaseEngageModel
from config import settings
from engage_app.utils import UserRoles, ResearchTeamPermissionLevels
from datetime import datetime
from auth_app.models import UserProfile
from engage_app.utils.constants import ResearchProjectParticipantStages


class ResearchProjectParticipant(BaseEngageModel):
    """This is the permissions model for the research project, where we will track which user has access to the Study,
    and what they are permitted to do on the research project."""
    user = models.ForeignKey(User, related_name="%(app_label)s_%(class)s_related_user", on_delete=models.CASCADE)
    study = models.ForeignKey(
        'ResearchProject', related_name="%(app_label)s_%(class)s_related_project", on_delete=models.CASCADE
    )
    is_patient_partner = models.BooleanField(default=False)
    is_research_partner = models.BooleanField(default=False)
    is_principal_investigator = models.BooleanField(default=False)
    is_project_lead = models.BooleanField(default=False)

    # Case 1: If a participant is approved but not active, that means they haven't accepted their invite
    # Case 2: If a participant is active, that means they are on the project
    # Case 3: If a participant is not active and not approved that means they have requested to join the project
    is_active = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    is_anonymous=models.BooleanField(default=False)

    # the join_date should only be set once the participant has been made active
    join_date = models.DateTimeField(null=True, blank=True)
    prompt_date = models.DateTimeField(null=True, blank=True)

    # Project State Management
    is_archived = models.BooleanField(default=False)

    # TODO: check to see if we should refactor these static methods to be under a Django Model Manager
    @staticmethod
    def add_user_to_team(
            user_id: int, study_id: int, is_patient_partner: bool = False, is_active: bool = False,
            is_approved: bool = False, is_lead: bool = False, new_user: bool = False, is_archived: bool = False,
    ):
        from auth_app.models.user_profile.user_profile import UserProfile
        """Add the specified user to the team. If they are not a patient partner, they are a researcher. There are
        no passive users on a team."""

        # First get the user object and profile object, check if the account is active and then add the user
        # to the project
        user = User.objects.get(id=user_id)
        user_profile = UserProfile.objects.filter(user=user).first()
        partner = None
        new_participant_query_dict = dict()

        if is_patient_partner and user_profile.role in UserRoles.get_patient_partner_types():
            new_participant_query_dict['is_patient_partner'] = True
        elif (not is_patient_partner and user_profile.is_researcher() and user_profile.is_active_researcher) or (
                not is_patient_partner and new_user):
            # add the researcher to the team only if they are an active researcher or a new user
            new_participant_query_dict['is_research_partner'] = True

        # when adding new user we can set the is_anon as the user profile global setting for project invitation
        if user_profile.is_valid_research_project_member or new_user:
            # TODO: add the appropriate signals to create user notifications when the participation record is updated
            partner = ResearchProjectParticipant.objects.create(
                study_id=study_id, user=user, is_active=is_active, is_approved=is_approved, is_project_lead=is_lead,
                is_archived=is_archived, is_anonymous=user_profile.is_anonymous,
                **new_participant_query_dict
            )

            # IF the partner object was created and active, save the join date and update the database
            if partner and is_active:
                partner.join_date = datetime.now()
                partner.is_active = True
                partner.save()

        return partner

    @staticmethod
    def get_permissions(user_id: int = None):
        """Retrieve the permissions model for the specified user. Will return the requested user or None."""
        if not user_id:
            return None

        return ResearchProjectParticipant.objects.filter(user_id=user_id).first()

    def is_active_on_project(self):
        project_permissions = self.get_permissions_level()
        if project_permissions in ResearchTeamPermissionLevels.get_roles_off_project():
            return False
        elif project_permissions in ResearchTeamPermissionLevels.get_roles_on_project():
            return True
        else:
            raise TypeError("This user does not match any permissions level on the project")

    def get_permissions_level(self):
        if self.is_project_lead:
            return ResearchTeamPermissionLevels.LEAD.name
        elif self.is_principal_investigator:
            return ResearchTeamPermissionLevels.ADMIN.name
        elif self.is_active:
            return ResearchTeamPermissionLevels.BASE.name
        elif not self.is_active and not self.is_approved:
            return ResearchTeamPermissionLevels.REQUEST.name
        elif not self.is_active and self.is_approved:
            return ResearchTeamPermissionLevels.INVITE.name
        else:
            return 'ERROR'

    def set_permission_level(self, permission_level: ResearchTeamPermissionLevels):
        # create a list of the lower level permissions
        lowest_level_permissions = [
            ResearchTeamPermissionLevels.BASE.name,
            ResearchTeamPermissionLevels.REQUEST.name,
            ResearchTeamPermissionLevels.INVITE.name
        ]
        if permission_level == ResearchTeamPermissionLevels.LEAD.name:
            self.is_project_lead = True
            self.is_principal_investigator = True
        elif permission_level == ResearchTeamPermissionLevels.ADMIN.name:
            self.is_project_lead = False
            self.is_principal_investigator = True
        elif permission_level in lowest_level_permissions:
            self.is_project_lead = False
            self.is_principal_investigator = False
        self.save()

    def get_user_profile(self):
        from auth_app.models.user_profile.user_profile import UserProfile
        return UserProfile.objects.filter(user_id=self.user_id)

    def get_current_role(self):
        if self.user_id == self.study.creator_id:
            return "Project Creator"
        elif self.is_principal_investigator:
            return "Principal Investigator"
        elif self.is_research_partner:
            return "Researcher"
        elif self.is_patient_partner:
            return "Patient Partner"
        else:
            "No Access"

    @property
    def is_creator(self):
        return self.user.id == self.study.creator_id

    @property
    def is_lead_researcher_or_creator(self):
        return self.is_active and (self.is_principal_investigator or self.is_creator or self.is_project_lead)

    @property
    def is_research_or_patient_partner(self):
        return self.is_active and (self.is_patient_partner or self.is_active_research_partner)

    @property
    def is_active_research_partner(self):
        from auth_app.models import UserProfile

        current_user_profile = UserProfile.objects.get(user_id=self.user_id)
        return current_user_profile.is_active_researcher and (
                self.is_research_partner or self.is_lead_researcher_or_creator
        )

    @property
    def is_edit_permissions_allowed(self):
        return self.is_lead_researcher_or_creator or self.user.is_superuser

    # commented out old code conflicting with current is_anonymous property, might remove if dose'nt cause any issues
    # @property
    # def is_anonymous(self):
    #     return self.user.first_name == settings.SCRIPT_USER_FIRST_NAME

    @property
    def stage(self):
        # The Stage of a user will have 5 statuses that are determined as such:
        # 1 - On the Project (permissions.is_active)
        # 2 - Awaiting Registration (not user.last_login)
        # 3 - Pending Profile Completion (not user_profile.is_minimum_profile_check_valid)
        # 4 - Invited to Project (not permissions.is_active and permissions.is_approved)
        # 5 - Requested to Join Project (not permissions.is_active and not permissions.is_approved)

        if self.is_active:
            return ResearchProjectParticipantStages.ACTIVE.value
        elif self.user.last_login is None:
            return ResearchProjectParticipantStages.UNREGISTERED.value
        elif not self.user.userprofile.is_minimum_profile_check_valid:
            return ResearchProjectParticipantStages.INCOMPLETE_PROFILE.value
        elif not self.is_active and not self.is_approved:
            return ResearchProjectParticipantStages.REQUEST.value
        elif not self.is_active and self.is_approved:
            return ResearchProjectParticipantStages.INVITE.value
        else:
            return 'Error'

    def to_json(self):
        return dict(
            id=str(self.id),
            user_id=self.user_id,
            full_name=self.user.get_full_name(),
            study_id=self.study_id,
            is_patient_partner=self.is_patient_partner,
            is_research_partner=self.is_research_partner,
            is_principal_investigator=self.is_principal_investigator,
            is_project_lead=self.is_project_lead,
            is_active=self.is_active,
            join_date=str(self.join_date),
            role=self.user.userprofile.role,
            is_approved=self.is_approved,
            permission_level=self.get_permissions_level(),
            email=self.user.email,
            stage=self.stage,
            prompt_date=self.prompt_date,
            is_archived=self.is_archived,
            is_anonymous=self.is_anonymous,
        )

    @classmethod
    def get_project_active_user(cls, project_id, include_all=False):
        """
        This function returns the active user on the project
        @params: project_id: new project id
        """
        # Get all active user on project
        # Filter based on project_id
        query = models.Q(study=project_id)

        # If include_all is False, filter active users
        if not include_all:
            query &= models.Q(is_active=True, is_anonymous=False)
        active_user_data = ResearchProjectParticipant.objects.filter(query)
        active_user = []
        if active_user_data.exists():
            for user_instance in active_user_data:
                temp_data = {
                    'id': user_instance.user.id,
                    'first_name': user_instance.user.first_name,
                    'last_name': user_instance.user.last_name,
                    'email': user_instance.user.email,
                    'role': UserProfile.objects.values('role').get(user=user_instance.user)['role']
                }
                active_user.append(temp_data)
        return active_user
