from django.db import models
from engage_app.utils import create_alphanumeric_code
from django.contrib.auth.models import User


class DiscussionBoard(models.Model):
    chat_room_code = models.CharField(max_length=255, unique=True)
    parent_task = models.ForeignKey(
        'engage_app.ResearchProjectTask', related_name='parent_research_task', on_delete=models.CASCADE, null=True,
        blank=True
    )
    research_project = models.ForeignKey(
        'engage_app.ResearchProject', related_name='research_project_discussion', on_delete=models.CASCADE, null=True,
        blank=True
    )
    board_creator = models.ForeignKey(User, related_name="message_board_creator", on_delete=models.CASCADE)
    title = models.TextField(max_length=255, default='')
    description = models.CharField(max_length=255, null=False, default="This is the room description")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def linked_study(self):
        is_linked_to_task = bool(self.parent_task)
        return self.parent_task.research_project if is_linked_to_task else self.research_project

    @property
    def display_title(self):
        if self.title == '':
            return self.linked_study.title if not bool(self.parent_task) else self.parent_task.title
        return self.title

    def to_json(self, user_id=None):
        # Get the last message sent to the board, this will be useful for displaying in the front-end
        from communication_app.models.message import Message
        updated_fields = dict()
        messages = Message.objects.filter(discussion_board=self, created_at__isnull=False).exclude(is_deleted=True)
        if messages.exists():
            updated_fields['last_message'] = messages.latest('created_at').to_json()

        if user_id:
            updated_fields['unread_message_count'] = self.get_unread_message_count(user_id)

        return dict(
            discussion_board_id=str(self.id),
            chat_room_code=self.chat_room_code,
            parent_task_id=self.parent_task_id,
            board_creator_id=self.board_creator_id,
            title=self.display_title,
            description=self.description,
            created_at=str(self.created_at),
            updated_at=str(self.updated_at),
            # TODO: Update this field with real values
            linked_study_id=self.linked_study.id,
            is_project_archived=self.linked_study.is_archived,
            **updated_fields
        )

    def save(self, *args, **kwargs):
        if not self.id:
            # When a new research project discussion board is created, we need to save in a new unique code for it
            is_unique = False
            while not is_unique:
                # Check if the new code is in the database, if not we can use it to save the new discussion board
                new_code = create_alphanumeric_code(16)
                if not DiscussionBoard.objects.filter(chat_room_code=new_code).exists():
                    is_unique = True
                    self.chat_room_code = new_code
        super().save(*args, **kwargs)

    def get_most_recent_messages(self, message_count):
        """Get the most recent X messages from a discussion board"""
        from communication_app.models import Message
        message_list = Message.objects.filter(discussion_board=self).order_by('-updated_at').exclude(
            is_deleted=True
        )[:message_count]
        return [message.to_json() for message in message_list]

    def user_can_modify_board(self, user_id):
        from engage_app.models import ResearchProjectParticipant
        user_permissions = ResearchProjectParticipant.objects.get(
            study_id=self.parent_task.research_project_id,
            user_id=user_id
        )
        return user_id == self.board_creator_id or user_permissions.is_lead_researcher_or_creator

    @staticmethod
    def get_all_users_discussion_boards(user_id: int):
        """Get all of the users discussion boards.
        """
        from engage_app.models import ResearchProjectParticipant

        # First get all of the studies that this user is participating in, if we are just returning the project
        # discussion boards then can just return the discussion boards that match the study ids, otherwise we will
        # have to search all tasks a user is assigned and then we can filter and retrieve all of those discussion boards
        participating_studies = list(ResearchProjectParticipant.objects.filter(
            user_id=user_id, is_active=True
        ).values_list('study_id', flat=True))
        research_project_boards = DiscussionBoard.objects.filter(
            research_project_id__in=participating_studies
        )
        # TODO: Limit this to only task boards that the user has talked in or has been assigned to in the future
        task_boards = DiscussionBoard.objects.filter(
            parent_task__research_project_id__in=participating_studies
        )
        return dict(
            research_project_boards=[project_board.to_json(user_id) for project_board in research_project_boards],
            task_discussion_boards=[task_board.to_json(user_id) for task_board in task_boards],
        )

    def get_unread_message_count(self, user_id):
        from communication_app.models import Message
        message_list = Message.objects.filter(discussion_board=self).exclude(is_deleted=True)
        unread_message_list = [msg for msg in message_list if user_id not in msg.users_that_read_message]
        return len(unread_message_list)
