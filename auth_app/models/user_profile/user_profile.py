from base64 import b64encode
from datetime import datetime

from aws_s3_provider.S3Service import S3Service
from cities_light.models import City
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models

from auth_app.models import ResearchInterest
from auth_app.utils import UserQuestionCode, ADMIN_SETTINGS_NAME
from auth_app.utils.common import get_default_profile_picture, calculate_years_from_date
from config import settings
from email_app.utils import EngageEmail, EmailTemplateConstants
from engage_app.utils import UserRoles, is_valid_uuid


class UserProfile(models.Model):
    user = models.OneToOneField(User, primary_key=True, on_delete=models.CASCADE)
    role = models.CharField(max_length=200, choices=UserRoles.to_list(), blank=True, null=True)
    profile_picture = models.TextField(null=True, blank=True)
    experience = models.TextField(blank=True, null=True)

    # User location
    user_location = models.ForeignKey(City, null=True, on_delete=models.CASCADE, related_name='+', blank=True)
    icu_location = models.ForeignKey(City, null=True, on_delete=models.CASCADE, related_name='+', blank=True)
    icu_institute = models.TextField(null=True, blank=True)
    pronouns = ArrayField(
        base_field=models.TextField(null=True, blank=True), null=True, blank=True
    )

    # Boolean checks to see if specific roles are granted to the user
    is_active_researcher = models.BooleanField(default=False)  # all researchers start off as inactive
    is_pending_researcher = models.BooleanField(default=True)  # all researchers start off as pending
    is_researcher_form_ready_for_review = models.BooleanField(default=False)

    # Track if the user has logged in before, if not we can direct them to the user profile settings page
    has_logged_in = models.BooleanField(default=True)

    researcher_form_review_date = models.DateTimeField(default=None, blank=True, null=True)
    is_minimum_profile_check_valid = models.BooleanField(default=False)

    # Social Media Links
    linkedin_link = models.URLField(null=True, blank=True, default='')
    twitter_link = models.URLField(null=True, blank=True, default='')
    facebook_link = models.URLField(null=True, blank=True, default='')
    instagram_link = models.URLField(null=True, blank=True, default='')
    research_gate_link = models.URLField(null=True, blank=True, default='')
    timezone = models.CharField(null=True, max_length=64)

    # insight_scope
    linked_to_insight_scope = models.BooleanField(default=False)
    insight_scope_id=models.IntegerField(null=True, blank=True)

    # User global settings
    is_anonymous = models.BooleanField(default=False)
    opt_out_project_invitations = models.BooleanField(default=False)

    def __str__(self):
        return self.user.get_full_name()

    # Research Interests
    research_interests = models.ManyToManyField(ResearchInterest)

    def is_researcher(self):
        return self.role == UserRoles.RESEARCHER.name or self.role == UserRoles.CLINICIAN.name

    @property
    def is_approved_researcher(self):
        return self.is_researcher() and self.is_active_researcher

    @property
    def is_patient_partner(self):
        return self.role in UserRoles.get_patient_partner_types()

    @property
    def is_valid_research_project_member(self):
        """Check if the current user is a patient or approve researcher"""
        return self.is_approved_researcher or self.is_patient_partner

    @property
    def get_unread_notification_count(self):
        from communication_app.models import Notification
        return Notification.objects.filter(receiver=self.user, read_at__isnull=True).count()

    def get_answer_by_dev_code(self, dev_code: str):
        from auth_app.models.user_profile.user_profile_answer import UserProfileAnswer
        user_profile_answer = UserProfileAnswer.objects.filter(
            question__dev_code=dev_code,
            user_profile=self
        )

        return user_profile_answer.first().selected_options if user_profile_answer.exists() else "None"

    # Edi Info Property Methods
    @property
    def get_date_of_birth(self):
        return self.get_answer_by_dev_code("E-DOB")

    @property
    def get_edi_answers_public(self):
        return self.get_answer_by_dev_code("E-SETTING")

    @property
    def get_gender(self):
        return self.get_answer_by_dev_code("E-GND")

    @property
    def get_sexual_orientation(self):
        return self.get_answer_by_dev_code("E-SEX")

    @property
    def get_birth_sex(self):
        return self.get_answer_by_dev_code("E-SEOR")

    @property
    def get_is_identified_native(self):
        return self.get_answer_by_dev_code("E-INA")

    @property
    def get_native_group(self):
        return self.get_answer_by_dev_code("E-NAT")

    @property
    def get_is_visible_minority(self):
        return self.get_answer_by_dev_code("E-MIN")

    @property
    def get_population_group(self):
        return self.get_answer_by_dev_code("E-POP")

    @property
    def get_has_disability(self):
        return self.get_answer_by_dev_code("E-IDS")

    @property
    def get_disability(self):
        return self.get_answer_by_dev_code("E-DSB")

    @property
    def get_first_language(self):
        return self.get_answer_by_dev_code("E-FLG")

    @property
    def get_most_used_language(self):
        return self.get_answer_by_dev_code("E-MLG")

    @property
    def get_contact_acknowledgements(self):
        contact_acknowledgements = self.get_answer_by_dev_code("P-CON")
        return contact_acknowledgements if contact_acknowledgements != "None" else []

    def get_edi_info_dict(self):
        return dict(
            date_of_birth=self.get_date_of_birth,
            edi_answers_public=self.get_edi_answers_public,
            gender=self.get_gender,
            sexual_orientation=self.get_sexual_orientation,
            birth_sex=self.get_birth_sex,
            is_identified_native=self.get_is_identified_native,
            native_group=self.get_native_group,
            is_visible_minority=self.get_is_visible_minority,
            population_group=self.get_population_group,
            has_disability=self.get_has_disability,
            disability=self.get_disability,
            first_language=self.get_first_language,
            most_used_language=self.get_most_used_language,
        )

    def get_profile_image(self):
        if self.profile_picture:
            try:
                picture = S3Service(settings.AWS_S3_BUCKET_INSIGHTSCOPE).get_file(self.profile_picture)
                picture = b64encode(picture.get('content'))
            except:
                picture = get_default_profile_picture()
        else:
            picture = get_default_profile_picture()

        return picture.decode('ascii')

    @staticmethod
    def get_user_profile_picture(user_id: str):
        user_profile = UserProfile.objects.filter(user_id=user_id)

        if user_profile.exists() and user_profile.get().profile_picture:
            picture = S3Service(settings.AWS_S3_BUCKET).get_user_photo_obj(user_id, user_profile.get().profile_picture)
            picture = b64encode(picture.get('content'))
        else:
            picture = get_default_profile_picture()

        return picture.decode('ascii')

    def get_role_query(self, section_query=False):
        # If this is the first time a user from insight-scope uses engage, set the role to passive
        if self.role is None:
            self.role = UserRoles.PASSIVE.name

        role = self.role
        if self.role == UserRoles.CARETAKER.name:
            role = UserRoles.FAMILY_OF_PATIENT.name
        elif self.role == UserRoles.CLINICIAN.name:
            role = UserRoles.RESEARCHER.name

        return {
            f'is_required_{role.lower()}': True
        }

    def get_question_text(self, question):
        """Method to get the text from the question based on the current user role"""
        role = self.role
        if self.role == UserRoles.CARETAKER.name:
            role = UserRoles.FAMILY_OF_PATIENT.name
        elif self.role == UserRoles.CLINICIAN.name:
            role = UserRoles.RESEARCHER.name
            
        key = "text_for_" + role.lower()

        return getattr(question, key, None)

    def save_answers(self, post_data, is_researcher_ready_for_review=False):
        from auth_app.models.user_profile.user_profile_answer import UserProfileAnswer
        from auth_app.models.user_profile.user_profile_question import UserProfileQuestion
        from auth_app.models.admin_settings import AdminSettings
        from communication_app.models.notification import Notification, NotificationTypes
        from django.shortcuts import reverse
        # profile_answers = convert_query_dict_to_dict(post_data)
        for key, val in post_data.items():
            # Check if the question exists, if not return an error
            if is_valid_uuid(key):
                question = UserProfileQuestion.objects.filter(id=key)
                val = val if isinstance(val, list) else [val]
                if question.exists():
                    # If the question exists, retrieve the answer, if it does not exists, create the answer, otherwise update
                    question = question.first()
                    if question.dev_code in ["P-INT", "I-RID"]:
                        self.research_interests.set(val)
                    UserProfileAnswer.objects.update_or_create(
                        defaults=dict(selected_options=val),
                        user_profile=self,
                        question=question
                    )
                else:
                    raise UserProfileQuestion.DoesNotExist()
        # After saving all the user answers, check if the researcher is being submitted for admin review
        if self.is_researcher() and is_researcher_ready_for_review:
            # check admin settings for the approval of researchers, if it is set to False, approve researcher
            researcher_approval_setting = AdminSettings.objects.get(name=ADMIN_SETTINGS_NAME.APPROVAL_REQUIRED_FOR_RESEARCHERS.value)

            if researcher_approval_setting.bool_value is False:
                self.is_active_researcher = True # set researcher is active
                self.is_pending_researcher = False
                self.is_researcher_form_ready_for_review = False

            # TODO: Validate if the user profile form is actually ready for review, are all req questions answered?
            self.is_researcher_form_ready_for_review = True
            self.researcher_form_review_date = datetime.now()
            self.save()

            # Send a notification to the admin saying that there is a researcher ready for review
            admin_user_list = User.objects.filter(is_superuser=True)
            for admin_user in admin_user_list:
                Notification.objects.create(
                    receiver=admin_user,
                    source_id=self.user_id,
                    content=f'The Researcher {self.user.get_full_name()} has submitted their profile for review. '
                            f'Please access the Pending Researchers tab to make a decision',
                    link=reverse('auth_app:react_user_profile', args=[self.user_id]),
                    type=NotificationTypes.USER.value
                )

                # Email the admin as well saying there is a new researcher profile ready for review
                admin_email_params = {
                    'email': admin_user.email,
                    'user': admin_user,
                    'link': f"{settings.SERVER_NAME}admin-panel/",
                    'researcher': self.user
                }

                email = EngageEmail(
                    subject=f'Engage | {EmailTemplateConstants.SUBJECT_REQUEST_FOR_RESEARCHER_APPROVAL_ADMIN}',
                    template_name=EmailTemplateConstants.REQUEST_FOR_RESEARCHER_APPROVAL_ADMIN,
                    template_params=admin_email_params
                )
                email.set_recipients(to=admin_email_params["email"], cc=admin_email_params['email'])
                email.send()

            # Lastly send a notification to the project creator saying that their project is now under review
            Notification.objects.create(
                receiver=self.user,
                # The source id for this message can come from the first admin user returned
                source_id=self.user_id,
                content=f'You have submitted your profile for review. Please wait until a decision has been made to '
                        f'approve you to the system as a researcher.',
                link=reverse('auth_app:react_user_profile', args=[self.user_id]),
                type=NotificationTypes.USER.value
            )

    def to_json(self):
        from engage_app.models.research_project.research_project_participant import ResearchProjectParticipant
        profile_answers_dict, user_bio = self.get_user_question_answers_list()

        project_participation_records = ResearchProjectParticipant.objects.filter(
            user_id=self.user_id, is_active=True
        )

        project_list = []
        if project_participation_records.exists():
            project_list = [permission.study.to_info_json() for permission in project_participation_records]
        return dict(
            user=self.user.id,
            username=self.user.username,
            first_name=self.user.first_name,
            last_name=self.user.last_name,
            email=self.user.email,
            is_active=self.user.is_active,
            role=self.get_role_label(),
            role_value=UserRoles[self.role].name,
            profile_picture=self.profile_picture,
            experience=self.experience,
            linkedin_link=self.linkedin_link,
            twitter_link=self.twitter_link,
            facebook_link=self.facebook_link,
            instagram_link=self.instagram_link,
            research_gate_link=self.research_gate_link,
            custom_answers=profile_answers_dict,
            city=self.user_location.name if self.user_location else '',
            user_location=self.user_location.id if self.user_location else '',
            icu_city=self.icu_location.name if self.icu_location else '',
            birthdate=self.get_birthdate(),
            household_salary=self.get_household_salary(),
            education_level=self.get_education_level(),
            research_interests=[r.title for r in self.research_interests.all()],
            projects_lead=project_participation_records.filter(
                is_principal_investigator=True
            ).count(),
            projects_participating=project_participation_records.filter(
                is_principal_investigator=False
            ).count(),
            active_projects=project_list,
            profile_link=f"/app/user/{self.user.id}",
            bio=user_bio,
            contact_acknowledgements=self.get_contact_acknowledgements or [],
            pronouns=self.pronouns or [],
            icu_institute=self.icu_institute,
            is_minimum_profile_check_valid=self.is_minimum_profile_check_valid,
            is_approved_researcher=self.is_approved_researcher,
            is_anonymous=self.is_anonymous,
            opt_out_project_invitations=self.opt_out_project_invitations,
            **self.get_edi_info_dict()
        )

    def to_public_json(self):
        from auth_app.models.user_profile.user_profile_answer import UserProfileAnswer

        # Get the bio for the user
        bio = UserProfileAnswer.objects.filter(question__dev_code="P-BIO", user_profile=self)
        bio_answer = ''
        if bio.exists():
            bio_answer = bio.first().selected_options[0]

        user_pronouns = []
        if self.pronouns:
            user_pronouns = list(filter(lambda p: bool(p != "I prefer not to answer"), list(self.pronouns)))

        return dict(
            user=self.user.id,
            username=self.user.username,
            first_name=self.user.first_name,
            last_name=self.user.last_name,
            email=self.user.email,
            role=self.get_role_label(),
            role_value=UserRoles[self.role].name,
            city=self.user_location.name if self.user_location else '',
            user_location=self.user_location.id if self.user_location else '',
            icu_city=self.icu_location.name if self.icu_location else '',
            research_interests=[r.title for r in self.research_interests.all()],
            profile_link=f"/app/user/{self.user.id}",
            bio=bio_answer,
            pronouns=user_pronouns,
            opt_out_project_invitations=self.opt_out_project_invitations,
        )

    def to_json_form_values(self, public=False):
        """Return a dict containing all of the user profile questions and their possible answers"""
        from auth_app.models.user_profile.user_profile_answer import UserProfileAnswer
        custom_answers_dict = {}
        answers = UserProfileAnswer.objects.filter(user_profile=self)
        for answer in answers:
            custom_answers_dict[str(answer.question.id)] = answer.selected_options
        user_profile_json = self.to_json()
        user_profile_json.pop('custom_answers')
        return dict(
            **user_profile_json,
            **custom_answers_dict,
        )

    def get_user_question_answers_list(self):
        from auth_app.models.user_profile.user_profile_answer import UserProfileAnswer
        from auth_app.models.user_profile.user_profile_question import UserProfileQuestion

        questions = UserProfileQuestion.objects.filter(**self.get_role_query())
        answers = UserProfileAnswer.objects.filter(
            user_profile=self, question__in=questions, question__is_displayed_in_profile_variables=True
        ).order_by(
            'question__section__order_number', 'question__order_number'
        )

        profile_answers_list = list()

        for answer in answers:
            profile_answers_dict = answer.to_json()
            profile_answers_list.append(profile_answers_dict)

        # Get the bio from the user profile questions
        bio = UserProfileAnswer.objects.filter(question__dev_code="P-BIO", user_profile=self)
        bio_answer = None
        if bio.exists():
            bio_answer = bio.first().selected_options[0]

        return profile_answers_list, bio_answer

    def get_custom_answers(self):
        profile_answers_list, _ = self.get_user_question_answers_list()

        for response in profile_answers_list:
            if response.get('question_text') == 'Date of birth':
                response['question_text'] = 'Age'
                birth_date = response.get('selected_options')

                if not birth_date or not birth_date[0]:
                    continue

                birth_date = datetime.strptime(birth_date[0], '%Y-%m-%d').date()
                age = calculate_years_from_date(birth_date)
                response['selected_options'] = f'{age} years'
            else:
                response['selected_options'] = ', '.join(response.get('selected_options'))

        return profile_answers_list

    def get_user_info_by_dev_code(self, code: UserQuestionCode):
        from auth_app.models.user_profile.user_profile_answer import UserProfileAnswer
        """Using the supplied dev code and the current user profiles class, create the full developer code
         To search for the corresponding user profile answer and return the information"""
        dev_code_list = []

        # if self.role == UserRoles.PATIENT:
        #     full_dev_code = f"P-{code}"
        if self.role in [UserRoles.FAMILY_OF_PATIENT.name, UserRoles.CARETAKER.name, UserRoles.PATIENT.name]:
            dev_code_list.append(f"F-{code}")
            dev_code_list.append(f"P-{code}")
        elif self.is_researcher():
            dev_code_list.append(f"R-{code}")

        user_answer = UserProfileAnswer.objects.filter(
            question__dev_code__in=dev_code_list,
            user_profile=self
        )

        # Check if we found a user answer, if we found multiple then we need to return two sets of answers
        if user_answer.exists() and user_answer.count() == 1:
            return user_answer.first().to_json()
        elif user_answer.exists() and user_answer.count() > 1:
            return [user.to_json() for user in user_answer]
        else:
            return None
            # raise UserProfileAnswer.DoesNotExist("The corresponding user answer could not be found for this question")

    def get_city(self):
        return self.get_user_info_by_dev_code(UserQuestionCode.CITY.value)

    def get_city_name(self):
        city_response = self.get_user_info_by_dev_code(UserQuestionCode.CITY.value)

        if city_response:
            city_response = city_response.get('selected_options')[0]

        return city_response

    def get_birthdate(self):
        return self.get_user_info_by_dev_code(UserQuestionCode.DATE_OF_BIRTH.value)

    def get_household_salary(self):
        return self.get_user_info_by_dev_code(UserQuestionCode.HOUSEHOLD_SALARY.value)

    def get_education_level(self):
        return self.get_user_info_by_dev_code(UserQuestionCode.LEVEL_OF_EDUCATION.value)

    def get_researcher_clinical_area(self):
        if self.is_researcher():
            return self.get_user_info_by_dev_code(UserQuestionCode.CLINICAL_AREA.value)
        return None

    def get_research_interests_text(self):
        return ', '.join([interest.title for interest in self.research_interests.all()])

    def get_role_label(self):
        return UserRoles.get_value_of_key(self.role)

    def get_list_of_user_research_projects_info(self, show_pending_invitations=False):
        from engage_app.models import ResearchProjectParticipant
        # Query all the research projects for the user, check to see if we want just their active projects
        # or also all the projects with pending invitations (either they were invited or tried to join)
        extra_query_params = dict()
        if not show_pending_invitations:
            extra_query_params['is_active'] = True
        research_project_permissions = ResearchProjectParticipant.objects.filter(
            user_id=self.user.id, **extra_query_params
        )
        project_list = []
        invited_project_list = []

        # key the permissions under a permissions property and project under the research_project property
        for permission in research_project_permissions:
            # Return 2 list, 1 of the incomplete projects and one of the complete projects
            if permission.is_active:
                project_list.append(dict(
                    permissions=dict(**permission.to_json()),
                    research_project=dict(**permission.study.to_table_json(add_tasks=True, user_id=self.user_id))
                ))
            else:
                invited_project_list.append(dict(
                    permissions=dict(**permission.to_json()),
                    research_project=dict(**permission.study.to_table_json(user_id=self.user_id))
                ))
        if show_pending_invitations:
            return project_list, invited_project_list
        return project_list

    def get_list_of_research_projects(self, completed=False, show_incomplete=False):
        """Get a queryset of all of the projects a user is apart of, active or inactive"""
        from engage_app.models import ResearchProjectParticipant
        research_project_permissions = ResearchProjectParticipant.objects.filter(user_id=self.user.id, is_active=True)
        project_list = []
        incomplete_project_list = []

        # key the permissions under a permissions property and project under the research_project property
        for permission in research_project_permissions:
            if show_incomplete:
                # Return 2 list, 1 of the incomplete projects and one of the complete projects
                if permission.study.is_complete:
                    project_list.append(dict(
                        permissions=dict(**permission.to_json()),
                        research_project=dict(**permission.study.to_json(add_tasks=True, user_id=self.user_id))
                    ))
                else:
                    incomplete_project_list.append(dict(
                        permissions=dict(**permission.to_json()),
                        research_project=dict(**permission.study.to_json(add_tasks=True, user_id=self.user_id))
                    ))
            elif (completed and permission.study.is_complete) or not completed:
                project_list.append(dict(
                    permissions=dict(**permission.to_json()),
                    research_project=dict(**permission.study.to_json(add_tasks=True, user_id=self.user_id))
                ))
        if show_incomplete:
            return project_list, incomplete_project_list
        return project_list

    def get_active_projects(self):
        from engage_app.models import ResearchProjectParticipant
        research_project_permissions = ResearchProjectParticipant.objects.filter(user_id=self.user.id, is_active=True)
        projects = []

        for permission in research_project_permissions:
            projects.append(permission.study)

        return projects

    def get_list_of_research_tasks(self):
        """Get a queryset of all of the research tasks a user is apart of"""
        from engage_app.models import ResearchProjectTask, ResearchProjectParticipant
        research_project_permissions = ResearchProjectParticipant.objects.filter(user_id=self.user.id)
        task_list = []

        # TODO: Check if a research project is complete and if so remove it from the query
        # For each project a user is apart of, return the total list of tasks
        for permission in research_project_permissions:
            research_task_list = ResearchProjectTask.objects.filter(research_project_id=permission.study.id)
            for task in research_task_list:
                task_list.append(dict(**task.to_json()))
        return task_list

    def get_most_recent_messages(self, message_count: int):
        from communication_app.models import DiscussionBoard, Message
        current_user_message_list = Message.objects.filter(sender=self.user).order_by('updated_at')[:message_count]
        discussion_board_id_set = set()
        for message in current_user_message_list:
            discussion_board_id_set.add(message.discussion_board_id)

        discussion_board_list = DiscussionBoard.objects.filter(id__in=discussion_board_id_set)
        message_list = []
        for discussion_board in discussion_board_list:
            most_recent_message = discussion_board.get_most_recent_messages(1)[0]
            sender_profile = UserProfile.objects.get(user__username=most_recent_message['sender'])
            message_list.append(dict(
                message=dict(**most_recent_message),
                discussion_board=dict(**discussion_board.to_json()),
                project=discussion_board.linked_study.to_json(),
                sender=sender_profile.to_json()
            ))
        return message_list

    def minimum_profile_completion_check(self):
        from auth_app.models import UserProfileAnswer, UserProfileQuestion

        # First check if we already have a valid profile check, then just return true and an empty list
        if self.is_minimum_profile_check_valid:
            return True, []

        # Find all the user profile questions that are required for a profile type, if they all have an answer
        # supplied then this user completed the profile check. Store the incomplete questions in a list to return to
        # the user
        required_user_profile_questions = UserProfileQuestion.objects.filter(
            is_mandatory=True, **self.get_role_query(), parent_question=None
        )
        incomplete_questions = []
        for question in required_user_profile_questions:
            current_user_answer = UserProfileAnswer.objects.filter(question=question, user_profile=self)
            if not current_user_answer.exists():
                incomplete_questions.append(str(question.id))
        user_check = len(incomplete_questions) == 0 or self.is_approved_researcher or self.user.is_superuser

        # If the user check if valid, then we can validate the user profile and save
        if user_check:
            self.is_minimum_profile_check_valid = True
            self.save()
        return user_check, incomplete_questions

    @classmethod
    def get_pending_researchers(cls):
        return cls.objects.filter(
            is_active_researcher=False, is_pending_researcher=True, is_researcher_form_ready_for_review=True,
            role__in=UserRoles.get_research_partner_types()
        )
