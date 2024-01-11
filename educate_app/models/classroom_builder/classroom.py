from datetime import datetime

from django.contrib.auth.models import User
from django.db import models, transaction

from auth_app.models import ResearchInterest

from base_app.utils.common import create_new_user
from engage_app.utils import UserRoles
from engage_app.utils import DateTypes


class Classroom(models.Model):
    # Fields for storing classroom details
    title = models.TextField(null=True)
    research_interests = models.ManyToManyField(ResearchInterest, blank=True)

    creator = models.ForeignKey(User, related_name="classroom_creator", on_delete=models.PROTECT)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # start date field
    is_using_start_date = models.BooleanField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    start_date_type = models.TextField(choices=DateTypes.to_list(), null=True, blank=True)

    # end date field
    is_using_end_date = models.BooleanField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    end_date_type = models.TextField(choices=DateTypes.to_list(), null=True, blank=True)


    def to_json(self, show_all_users=False):
        from educate_app.models import ClassroomParticipants

        query_members = models.Q(classroom=self.id)
        # If show_all_users is False, filter active users
        if not show_all_users:
            query_members &= models.Q(is_active=True)

        classroom_members = ClassroomParticipants.objects.filter(query_members)

        return dict(
            id=self.id,
            creator=self.creator.get_full_name(),
            classroom_members=classroom_members,
            title=self.title,
            is_using_start_date=self.is_using_start_date,
            start_date=self.start_date,
            start_date_type=self.start_date_type,
            is_using_end_date=self.is_using_end_date,
            end_date_type=self.end_date_type,
            end_date=self.end_date,
        )


    def get_classroom_members(self, show_inactive_users=False):
        from educate_app.models import ClassroomParticipants
        query_members = models.Q(classroom=self.id)
        # If show_all_users is False, filter active users
        if not show_inactive_users:
            query_members &= models.Q(is_active=True)

        classroom_members = ClassroomParticipants.objects.filter(query_members)
        return classroom_members


    @staticmethod
    def create_classroom_owner_permissions(sender, instance, created, **kwargs):
        from educate_app.models import ClassroomParticipants

        # TODO: query the user role and set the corresponding role to true
        if created:
            ClassroomParticipants.objects.create(
                classroom_id=instance.id,
                user=instance.creator,
                is_active=True,
                join_date=datetime.now()
            )


    @staticmethod
    def add_user_to_classroom(self, user_list):
        from educate_app.models import ClassroomParticipants

        # if the list is empty send error
        if not user_list:
            return "User list is empty"

        # get all the existing user from the user list first
        existing_users = User.objects.filter(email__in=[user['email'] for user in user_list])

        # get all the participants if any
        classroom_participants_email = set(
            ClassroomParticipants.objects.filter(
                classroom=self.id,
                user__email__in=[user['email'] for user in user_list]
            ).values_list('user__email', flat=True)
        )

        # error message at different stages
        error_message = ''
        # list of participants that needs to be added
        classroom_new_participants = []
        # list of accounts for which adding or creating a new profile was unsuccessful
        rejected_user_list = []

        # first query for existing user and add them if they are not in classroom
        for user in existing_users:
            if user.email not in classroom_participants_email:
                classroom_participant_platform_user = ClassroomParticipants(
                    classroom=self,
                    user=user,
                    is_active=user.is_active,
                )
                classroom_new_participants.append(classroom_participant_platform_user)
            else:
                error_message = "All users are already part of the classroom."

        # now create a list of new user and make sure to remove the user in:
        # 1. Already classroom participant
        # 2. Existing User; because they have been already added to the list 
        filtered_user_list = [
            user for user in user_list
            if user['email'] not in classroom_participants_email
            and user['email'] not in {exist_user.email for exist_user in existing_users}
        ]
        if not filtered_user_list:
            error_message = "All users are already part of the classroom."

        # TODO: Send an email to new users on platform with their credentials
        # now loop over the filtered user and create an account for them
        for user in filtered_user_list:
            try:
                user_info = {
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'email': user['email'],
                    'role': UserRoles.PASSIVE.name,
                }
                # create a new user
                new_user_result = create_new_user(user_info)
                new_user = new_user_result['user']
                new_user_profile = new_user_result['new_user_profile']

                classroom_participant_new_user = ClassroomParticipants(
                    classroom=self,
                    user=new_user,
                    is_active=False,
                )
                classroom_new_participants.append(classroom_participant_new_user)

            except Exception as e:
                rejected_user_list.append(eval(str(e)))

        # bulk add all the users
        if classroom_new_participants:
            with transaction.atomic():
                try:
                    ClassroomParticipants.objects.bulk_create(classroom_new_participants)
                except Exception as e:
                    print(f"Error occurred during bulk_create: {str(e)}")

        return {'rejected_users': rejected_user_list, 'error_message': error_message}

models.signals.post_save.connect(Classroom.create_classroom_owner_permissions, sender=Classroom)
