from datetime import datetime

from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import QuerySet, Q

from auth_app.models import ResearchInterest
import engage_app.models
from engage_app.utils import UserRoles, is_valid_uuid, \
    ParticipantDemographicTypes, ProjectRecruitingStatus, DateTypes


class ResearchProject(models.Model):
    creator = models.ForeignKey(User, related_name="project_creator", on_delete=models.PROTECT)
    main_contact = models.ForeignKey(
        User, related_name="project_contact", on_delete=models.PROTECT, null=True, blank=True
    )

    # Fields to determine project status
    is_approved = models.BooleanField(default=False)
    is_ready_for_review = models.BooleanField(default=False)
    review_date = models.DateTimeField(default=None, blank=True, null=True)
    is_public = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)

    # Fields for storing project details
    title = models.TextField(null=True)
    reference_name = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    # start date field
    start_date = models.DateField(null=True, blank=True)
    start_date_type = models.TextField(choices=DateTypes.to_list(), null=True, blank=True)
    is_using_start_date = models.BooleanField(null=True, blank=True)

    # end date field
    end_date = models.DateField(null=True, blank=True)
    end_date_type = models.TextField(choices=DateTypes.to_list(), null=True, blank=True)
    is_using_end_date = models.BooleanField(null=True, blank=True)

    icu_city = models.TextField(null=True, blank=True)
    icu_country = models.TextField(null=True, blank=True)
    partner_commitment_description = models.TextField(max_length=255, default='')
    roles_needed = ArrayField(models.TextField(null=True, choices=UserRoles.to_list()))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_complete = models.BooleanField(default=False)
    contact_email = models.EmailField(null=True, blank=True, max_length=255)
    research_interests = models.ManyToManyField(ResearchInterest)

    # Social Media Links
    linkedin_link = models.URLField(null=True, blank=True, default='')
    twitter_link = models.URLField(null=True, blank=True, default='')
    facebook_link = models.URLField(null=True, blank=True, default='')
    instagram_link = models.URLField(null=True, blank=True, default='')
    research_gate_link = models.URLField(null=True, blank=True, default='')
    website_link = models.URLField(null=True, blank=True, default='')

    # new fields from updated design
    is_contact_visible = models.BooleanField(default=False, null=True, blank=True)
    centre_format = models.TextField(max_length=255, null=True, blank=True)
    type = models.TextField(null=True, blank=True)
    study_format = ArrayField(
        base_field=models.TextField(blank=True, null=True),
        blank=True, null=True, size=None
    )

    # Field to determine if the project is looking for specific team demographics. If this is false, make everyone
    # on the system aware of this project, but if it is true, only show the project to team members that might match
    has_social_media_links = models.BooleanField(default=False, blank=True)
    has_specific_team_demographics = models.BooleanField(default=False, blank=True)
    participant_demographics_type = models.CharField(
        null=True, blank=True, choices=ParticipantDemographicTypes.to_list(), max_length=200
    )
    recruiting_status = models.TextField(choices=ProjectRecruitingStatus.to_list(), null=True, blank=True)

    @property
    def get_creator_profile_picture_url(self):
        return f'/app/profile/{self.creator.username}/image/'

    @property
    def get_project_submission_status(self):
        if self.is_archived:
            return 'Inactive'
        elif self.is_approved and not self.is_complete:
            return 'Active'
        elif self.is_ready_for_review and not self.is_approved:
            return 'Pending'
        elif self.is_complete and self.is_approved:
            return 'Completed'
        elif not self.is_ready_for_review and not self.is_approved:
            return 'Draft'
        else:
            return 'Unknown'

    @property
    def get_icu_location(self):
        from cities_light.models import Country, City
        country = Country.objects.get(name=self.icu_country)
        city = City.objects.get(name=self.icu_city, country=country)
        return f'{city.name}, {country.name}'

    def to_table_json(self, add_tasks=False, user_id=None):
        from engage_app.models import ResearchProjectTask, ResearchProjectTaskAssignedUser
        if add_tasks:
            research_tasks = ResearchProjectTask.objects.filter(research_project=self)
            if user_id:
                assigned_tasks = ResearchProjectTaskAssignedUser.objects.filter(
                    research_project_task_id__in=research_tasks, assigned_user_id=user_id
                ).values_list(
                    'research_project_task_id', flat=True)
                research_tasks = [rt.to_json(user_id) for rt in research_tasks.filter(id__in=assigned_tasks)]
            else:
                research_tasks = [task.to_json() for task in research_tasks]

        else:
            research_tasks = None

        return dict(
            id=self.id,
            reference_name=self.reference_name,
            project_leads=self.get_lead_investigator_names(),
            start_date=self.start_date,
            end_date=self.end_date,
            recruiting_status=self.recruiting_status,
            title=self.title,
            tasks=research_tasks,
            is_using_start_date=self.is_using_start_date,
            is_using_end_date=self.is_using_end_date,
            end_date_type=self.end_date_type,
            start_date_type=self.start_date_type,
            is_approved=self.is_approved,
            is_ready_for_review=self.is_ready_for_review,
            is_complete=self.is_complete,
            submission_status=self.get_project_submission_status,
            is_public=self.is_public,
            is_archived=self.is_archived,
        )

    def to_json(self, add_tasks=False, user_id=None):
        # TODO: Update this with actual queries to the UserProfile Models connected to the Research Study when created
        from engage_app.models import ResearchProjectParticipant, ResearchProjectTask
        from communication_app.models import DiscussionBoard

        # Create the study team by querying the related ResearchProjectParticipant entries
        team_members = ResearchProjectParticipant.objects.filter(study=self.id, is_active=True, is_anonymous=False)
        study_team = [member.to_json() for member in team_members]

        # Building an updated json dict
        updated_json_dict = dict()
        discussion_board = DiscussionBoard.objects.filter(research_project=self)
        if discussion_board.exists():
            updated_json_dict['discussion_board'] = discussion_board.first().chat_room_code
        if add_tasks:
            research_tasks = ResearchProjectTask.objects.filter(research_project=self)
            query_dict = dict()
            if user_id:
                query_dict['user_id'] = user_id
                user_permissions = team_members.filter(user_id=user_id)
                if user_permissions.exists():
                    updated_json_dict['user_permissions'] = user_permissions.first().to_json()

                    # Add the rest of the users to the request if a project lead is viewing the project
                    user_permissions = user_permissions.first()
                    if user_permissions.is_lead_researcher_or_creator:
                        in_active_users = ResearchProjectParticipant.objects.filter(
                            Q(is_active=False) | Q(is_anonymous=True), study=self.id,
                        )
                        study_team = [*study_team, *[member.to_json() for member in in_active_users]]
                else:
                    # Check for a user that is invited to the project but has not accepted the invite
                    potential_participant = ResearchProjectParticipant.objects.filter(study_id=self.id, user_id=user_id)
                    if potential_participant.exists():
                        updated_json_dict['user_permissions'] = potential_participant.first().to_json()
            updated_json_dict['tasks'] = [rt.to_json(**query_dict) for rt in research_tasks]
            task_due_status = [rt.get_task_status() for rt in research_tasks]
            updated_json_dict['due_status'] = "Overdue Tasks" if "Task Overdue" in task_due_status else "Assign Task"

        # Get the alternate lead if they exist
        alternate_lead = team_members.filter(is_project_lead=True).exclude(user_id=self.creator_id)
        return dict(
            id=self.id,
            creator=self.creator.get_full_name(),
            creator_id=self.creator.id,
            is_approved=self.is_approved,
            title=self.title,
            reference_name=self.reference_name,
            description=self.description,
            icu_city=self.icu_city,
            icu_country=self.icu_country,
            partner_commitment_description=self.partner_commitment_description,
            roles_needed=self.roles_needed,
            start_date=self.start_date,
            start_date_type=self.start_date_type,
            is_using_start_date=self.is_using_start_date,
            end_date=self.end_date,
            end_date_type=self.end_date_type,
            is_using_end_date=self.is_using_end_date,
            created_at=self.created_at.strftime("%m/%d/%Y %H:%M:%S"),
            updated_at=self.updated_at.strftime("%m/%d/%Y %H:%M:%S"),
            study_team=study_team,
            creator_profile_pic_url=self.get_creator_profile_picture_url,
            review_date=self.review_date,
            custom_answers=self.get_research_question_answers_list(),
            research_interests=[r.title for r in self.research_interests.all()],
            type=self.type,
            recruiting_status=self.recruiting_status,
            study_format=self.study_format,
            is_contact_visible=self.is_contact_visible,
            centre_format=self.centre_format,
            has_specific_team_demographics=self.has_specific_team_demographics,
            participant_demographics_type=self.participant_demographics_type,
            has_social_media_links=self.has_social_media_links,
            main_contact={
                'name': self.main_contact.get_full_name() if self.main_contact else ""
            },
            alternate_lead=alternate_lead.first().user_id if alternate_lead.exists() else None,
            alternate_lead_name=alternate_lead.first().user.get_full_name() if alternate_lead.exists() else None,
            project_leads=self.get_lead_investigator_names(),
            is_public=self.is_public,
            is_archived=self.is_archived,
            **updated_json_dict
        )

    def to_form_values(self):
        return dict(
            title=self.title,
            partner_commitment_description=self.partner_commitment_description,
            roles_needed=self.roles_needed,
            research_interests=[r.id for r in self.research_interests.all()],
            research_interest_names=[r.title for r in self.research_interests.all()],
            has_specific_team_demographics=self.has_specific_team_demographics,
            participant_demographics_type=self.participant_demographics_type,
            type=self.type,
            start_date=self.start_date,
            start_date_type=self.start_date_type,
            is_using_start_date=self.is_using_start_date,
            end_date=self.end_date,
            end_date_type=self.end_date_type,
            is_using_end_date=self.is_using_end_date,
            study_format=self.study_format,
            is_contact_visible=self.is_contact_visible,
            centre_format=self.centre_format,
            has_social_media_links=self.has_social_media_links,
            reference_name=self.reference_name,
            recruiting_status=self.recruiting_status,
            is_public=self.is_public,
            is_archived=self.is_archived,
            id=self.id
        )

    def to_info_json(self):
        return dict(
            title=self.title,
            reference_name=self.reference_name,
            start_date=self.start_date,
            start_date_type=self.start_date_type,
            is_using_start_date=self.is_using_start_date,
            end_date=self.end_date,
            end_date_type=self.end_date_type,
            is_using_end_date=self.is_using_end_date,
            is_complete=self.is_complete,
            recruiting_status=self.recruiting_status,
            id=self.id
        )

    def save_answers(self, post_data, is_research_project_ready_for_review=False):
        from engage_app.models.research_project.research_project_question import ResearchProjectQuestion
        from engage_app.models.research_project.research_project_answer import ResearchProjectAnswer
        from communication_app.models.notification import Notification, NotificationTypes
        from django.shortcuts import reverse

        for key, val in post_data.items():
            if is_valid_uuid(key):
                # Check if the question exists, if not return an error
                question = ResearchProjectQuestion.objects.filter(id=key)
                val = val if isinstance(val, list) else [val]
                if question.exists():
                    # If the question exists, retrieve the answer, if it does not exist, create the answer, otherwise update
                    question = question.first()
                    ResearchProjectAnswer.objects.update_or_create(
                        defaults=dict(selected_options=val),
                        research_project=self,
                        question=question
                    )
                else:
                    raise ResearchProjectQuestion.DoesNotExist()

        # After saving all the user answers, check if the researcher is being submitted for admin review
        if is_research_project_ready_for_review:
            self.is_ready_for_review = True
            self.review_date = datetime.now()
            self.save()

            # Send a notification to the admin saying that there is a research project ready for review
            admin_user_list = User.objects.filter(is_superuser=True)
            for admin_user in admin_user_list:
                Notification.objects.create(
                    receiver=admin_user,
                    source_id=self.id,
                    content=f'The user {self.creator.get_full_name()} has submitted the project: {self.title} for'
                            f' review. Please access the Pending Project Panel to make a decision.',
                    link=reverse('auth_app:react_project_details', args=[self.id]),
                    type=NotificationTypes.PROJECT.value
                )

            # Lastly send a notification to the project creator saying that their project is now under review
            Notification.objects.create(
                receiver=self.creator,
                # The source id for this message can come from the first admin user returned
                source_id=self.id,
                content=f'You have successfully submitted the project  {self.creator.get_full_name()} for review. '
                        f'Before your project becomes available to the site, please wait for approval.',
                link=reverse('auth_app:react_project_details', args=[self.id]),
                type=NotificationTypes.PROJECT.value
            )

    def get_research_question_answers_list(self):
        from engage_app.models.research_project.research_project_answer import ResearchProjectAnswer
        from engage_app.models.research_project.research_project_question import ResearchProjectQuestion

        questions = ResearchProjectQuestion.objects.all()
        answers = ResearchProjectAnswer.objects.filter(research_project=self, question__in=questions)

        project_answers_list = list()

        for answer in answers:
            project_answers_dict = answer.to_json()
            project_answers_dict['indent'] = answer.question.get_parent_question_count()
            project_answers_list.append(project_answers_dict)

        return project_answers_list

    def get_team_size(self) -> str:
        from engage_app.models import ResearchProjectParticipant
        team_members = ResearchProjectParticipant.objects.filter(study=self)
        return f'{team_members.count()}'

    def get_lead_research_team(self):
        from engage_app.models import ResearchProjectParticipant
        return ResearchProjectParticipant.objects.filter(
            is_principal_investigator=True, is_research_partner=True, study=self
        )

    @property
    def participants(self) -> QuerySet['engage_app.models.ResearchProjectParticipant']:
        from engage_app.models import ResearchProjectParticipant
        return ResearchProjectParticipant.objects.filter(study=self)

    @staticmethod
    def create_corresponding_models(sender, **kwargs):
        ResearchProject.create_project_owner_permissions(kwargs['created'], kwargs['instance'])
        ResearchProject.create_default_discussion_board(kwargs['created'], kwargs['instance'])

    @staticmethod
    def create_project_owner_permissions(is_created, research_study):
        """If the Research Project Task is being created, create a corresponding discussion board"""
        if is_created:
            from engage_app.models import ResearchProjectParticipant
            # a research project task is being created
            ResearchProjectParticipant.objects.create(
                study_id=research_study.id,
                user=research_study.creator,
                is_active=True,
                is_principal_investigator=True,
                is_project_lead=True,
                is_research_partner=True,
                is_archived=research_study.is_archived,
                join_date=datetime.now()
            )

    @staticmethod
    def create_default_discussion_board(is_created, research_study):
        """If the Research Project Task is being created, create a corresponding discussion board"""
        if is_created:
            from communication_app.models import DiscussionBoard
            # a research project task is being created
            DiscussionBoard.objects.create(
                research_project_id=research_study.id,
                description=f"The message board for the research study: {research_study.title}",
                board_creator=research_study.creator
            )

    @classmethod
    def get_pending_projects(cls):
        return cls.objects.filter(is_approved=False)

    @classmethod
    def get_active_projects(cls):
        return cls.objects.filter(is_approved=True)

    def get_lead_investigators(self):
        from engage_app.models import ResearchProjectParticipant
        lead_investigators = ResearchProjectParticipant.objects.filter(is_project_lead=True, study=self)
        return lead_investigators

    def get_lead_investigator_names(self):
        lead_investigators = self.get_lead_investigators()
        name_list = [lead.user.get_full_name() for lead in lead_investigators]
        return ', '.join(name_list)


models.signals.post_save.connect(ResearchProject.create_corresponding_models, sender=ResearchProject)
