from django.contrib.auth.models import User
from django.db import models

from engage_app.exceptions import ResearchProjectPermissionsDoesNotExistError


class ResearchProjectTaskAssignedUser(models.Model):
    class Meta:
        unique_together = ('research_project_task', 'assigned_user')

    research_project_task = models.ForeignKey(
        'ResearchProjectTask', related_name="parent_research_project", on_delete=models.CASCADE
    )
    assigned_user = models.ForeignKey(
        User, related_name='research_task_assigned_user', on_delete=models.CASCADE
    )
    comments = models.TextField(null=True, blank=True)
    is_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_prompted = models.BooleanField(default=False)
    prompted_date = models.DateTimeField(null=True)

    def __str__(self):
        return self.assigned_user.userprofile.__str__()

    def to_json(self):
        return dict(
            is_complete=self.is_complete,
            assigned_user_profile=self.assigned_user.userprofile.to_json(),
            assigned_at=self.created_at,
            updated_at=self.updated_at,
            comments=self.comments,
            id=self.id,
            is_prompted=self.is_prompted,
            prompted_date=self.prompted_date
        )

    @staticmethod
    def assign_user_to_task(research_task_id, user_id):
        """Validate that the user is apart of this project and assign this user to the selected task id"""
        from engage_app.models import ResearchProjectTask, ResearchProjectParticipant
        research_task = ResearchProjectTask.objects.get(id=research_task_id)
        study_id = research_task.research_project_id
        project_permissions = ResearchProjectParticipant.objects.filter(
            user_id=user_id, is_active=True, study_id=study_id
        )
        # Check if the permissions exist, if they do, assign this user to the research task by creating a new
        # instance of this model
        if project_permissions.exists():
            assigned_user = ResearchProjectTaskAssignedUser.objects.create(
                research_project_task_id=research_task_id, assigned_user_id=user_id
            )
            return assigned_user
        else:
            raise ResearchProjectPermissionsDoesNotExistError(user_id=user_id, research_study_id=study_id)

    @staticmethod
    def get_all_assigned_task_for_user(user_id: int, is_complete: bool = False):
        """Get all of the specified users assigned tasks and return them to the user as a json list
        Parameters:
            is_complete - (bool|default False) will return incomplete tasks by default"""

        assigned_user_tasks = ResearchProjectTaskAssignedUser.objects.filter(
            assigned_user_id=user_id, is_complete=is_complete
        )
        assigned_task_list = []
        for user_task in assigned_user_tasks:
            assigned_task_list.append(user_task.research_project_task.to_json())
        return assigned_task_list
