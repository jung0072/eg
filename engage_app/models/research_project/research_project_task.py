from datetime import datetime, timedelta

from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.urls import reverse

from communication_app.models import Notification
from communication_app.utils import NotificationTypes
from engage_app.utils import ResearchTaskDueStatues, UserRoles, DateTypes


class ResearchProjectTask(models.Model):
    research_project = models.ForeignKey(
        'ResearchProject', related_name="parent_research_project", on_delete=models.CASCADE
    )
    task_creator = models.ForeignKey(User, related_name="research_task_creator", on_delete=models.CASCADE)
    title = models.TextField(max_length=255)
    survey_link = models.URLField(blank=True, default='', null=True)
    description = models.TextField(null=True, blank=True)
    subject = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # due date field
    due_date = models.DateTimeField(null=True, blank=True)
    due_date_type = models.TextField(choices=DateTypes.to_list(), null=True, blank=True)
    is_using_due_date = models.BooleanField(null=True, blank=True)

    roles_needed = ArrayField(models.TextField(
        null=True, choices=UserRoles.to_list()
    ), null=True, blank=True)
    hide_submitted_files = models.BooleanField(default=False)
    is_complete = models.BooleanField(default=False)

    def get_task_status(self, user_id=None):
        from engage_app.models import ResearchProjectTaskAssignedUser
        """
        "Task Due Soon" - The due date is a week or less away
        "Task Overdue" - you are currently past the due date
        "Assign Task" - there are no users on this task and it must be assigned
        "Task Close" - the task was submitted if a user id was given, we will check to see if this user submitted
        """

        if self.due_date:
            # if we have a user id, try and check if they have submitted the task, if they have then the task is closed
            if user_id:
                assigned_user = ResearchProjectTaskAssignedUser.objects.filter(assigned_user_id=user_id)
                if assigned_user.exists() and assigned_user.first().is_complete:
                    return ResearchTaskDueStatues.CLOSED.value

            # get a list of the task assignees, the timezone info from the due date and the current date to compare
            task_assignees = ResearchProjectTaskAssignedUser.objects.filter(research_project_task=self)
            timezone_info = self.due_date.tzinfo
            current_date = datetime.now(tz=timezone_info)
            if not task_assignees.exists():
                return ResearchTaskDueStatues.UNASSIGNED.value
            elif self.due_date - current_date < timedelta(days=7):
                return ResearchTaskDueStatues.DUE_SOON.value
            elif current_date > self.due_date:
                return ResearchTaskDueStatues.OVERDUE.value
            else:
                return ResearchTaskDueStatues.ASSIGN.value
        return "Unknown"

    def to_json(self, user_id=None):
        from communication_app.models import DiscussionBoard

        # Update the returned dict with the found information below. First check for a discussion board before setting it
        updated_json_dict = dict()
        discussion_board = DiscussionBoard.objects.filter(parent_task=self)
        if discussion_board.exists():
            updated_json_dict['discussion_board'] = discussion_board.first().chat_room_code
        return dict(
            research_project_id=self.research_project_id,
            task_creator_id=self.task_creator_id,
            task_creator=self.task_creator.get_full_name(),
            title=self.title,
            survey_link=self.survey_link,
            description=self.description,
            created_at=str(self.created_at),
            updated_at=str(self.updated_at),
            task_id=self.id,
            is_using_due_date=self.is_using_due_date,
            due_date_type=self.due_date_type,
            due_date=self.due_date,
            due_status=self.get_task_status(user_id=user_id),
            roles_needed=self.roles_needed,
            subject=self.subject,
            research_project_title=self.research_project.reference_name,
            research_project_archive=self.research_project.is_archived,
            hide_submitted_files=self.hide_submitted_files,
            is_complete=self.is_complete,
            **updated_json_dict
        )

    @staticmethod
    def post_save(sender, **kwargs):
        """Callback for when a research project task is created or saved."""

        # Check if this is a new task, or an existing one being updated
        task: ResearchProjectTask = kwargs['instance']
        if kwargs['created']:
            # Send out a notification to the team, except the person who created it.
            for participant in task.research_project.participants:
                if participant.user == task.task_creator:
                    continue

                notification = Notification.objects.create(
                    receiver=participant.user,
                    source_id=task.research_project_id,
                    content=f'{task.research_project.title}: New research task created \'{task.title}\'',
                    link=reverse(
                        'auth_app:react_project_task_details',
                        kwargs={'research_project_task_id': task.id}
                    ),
                    type=NotificationTypes.PROJECT.value
                )
                notification.save()

            # This is a new object, so also make a default discussion board for it.
            from communication_app.models import DiscussionBoard
            DiscussionBoard.objects.create(
                parent_task=task,
                description=f"The message board for research task: {task.title}",
                board_creator=task.task_creator
            )
        else:
            # Otherwise, it was only updated. So just send a notification to everyone else on the team.
            # TODO: No way to edit the task via the app right now.
            pass

    def get_all_task_files(self):
        """Return the json information for all of the research task files"""
        from engage_app.models.research_project.research_project_task_file import ResearchProjectTaskFile
        return [file.to_json for file in ResearchProjectTaskFile.objects.filter(parent_task=self)]

    def get_all_members_for_task(self):
        """Get all members associated with the task"""
        from engage_app.models.research_project.research_project_task_assigned_user import \
            ResearchProjectTaskAssignedUser

        assigned_users = ResearchProjectTaskAssignedUser.objects.filter(
            research_project_task=self
        ).select_related('assigned_user__userprofile')

        members = [
            {
                'id': au.assigned_user.id,
                'name': au.assigned_user.get_full_name(),
                'role': au.assigned_user.userprofile.role,
                'comments': au.comments,
                'updated_at': au.updated_at,
                'is_complete': au.is_complete,
                'is_prompted': au.is_prompted,
                'prompted_date': au.prompted_date
            }
            for au in assigned_users
        ]

        return members

models.signals.post_save.connect(ResearchProjectTask.post_save, sender=ResearchProjectTask)
