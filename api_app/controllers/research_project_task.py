import datetime

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404, reverse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api_app.serializers import ResearchProjectTaskAssignedUserSerializer, ResearchTaskSerializer, ErrorSerializer, \
    SuccessSerializer
from api_app.utils.permissions import RequireProjectTaskAssigned, RequireProjectMembership, RequireProjectTaskOwner, \
    IsProjectNotArchived
from communication_app.models import Notification
from communication_app.utils import NotificationTypes
from email_app.utils import EngageEmail, EmailTemplateConstants
from engage_app.forms import ResearchProjectTaskForm
from engage_app.models import ResearchProjectTask, ResearchProjectTaskFile, ResearchProjectTaskAssignedUser, \
    ResearchProjectParticipant, ResearchProject
from engage_app.utils import DateTypes


class ResearchProjectTaskController(APIView):

    def get_permissions(self):
        # If the request method is DELETE then add the extra permission class
        if self.request.method == 'DELETE':
            return [IsAuthenticated(), RequireProjectMembership(), RequireProjectTaskOwner(), IsProjectNotArchived()]
        else:
            # For all other request methods
            return [IsAuthenticated(), RequireProjectMembership(), IsProjectNotArchived(), IsProjectNotArchived()]

    def post(self, request, project_id, task_id=None):
        # get a reference to the current user profile and their project permissions
        post_data = request.data.copy()

        # Check if we are creating or editing the task by checking to see if we were supplied a task id
        existing_task = ResearchProjectTask.objects.get(id=task_id) if task_id else None
        task_form = ResearchProjectTaskForm(
            post_data, task_creator_id=request.user.id, research_project_id=project_id, instance=existing_task
        )

        if task_form.is_valid():
            research_task = task_form.save()
            user_ids = request.data.get('user_ids', [])

            # Get the list of assigned users and existing assigned users and also upload the protocol file
            assign_multiple_user_to_task(user_ids, research_task)

            return Response(dict(
                success=SuccessSerializer({
                    'success': "Successfully updated the task" if task_id else "You have successfully created the task.",
                    'redirect_link': reverse(
                        'auth_app:react_project_task_details',
                        kwargs={'research_project_task_id': research_task.id}
                    ),
                    'resource_id': research_task.id
                }).data,
            ), status=status.HTTP_200_OK)

        return Response(
            ErrorSerializer(dict(error="This is not a valid request")).data, status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, project_id=None, task_id=None):
        """Delete a task and all related models """
        task_id = request.data.get('taskID')
        try:
            with transaction.atomic():
                # Delete the task
                ResearchProjectTask.objects.get(id=task_id).delete()

        except Exception as user_deletion_error:
            return Response(
                data=ErrorSerializer(dict(
                    error="Could not delete the selected task",
                    form_errors=dict(could_not_delete=['Failed to delete the task and related objects.'])
                )).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )
        return Response(
            data=SuccessSerializer(dict(success='You have successfully deleted the task')).data,
            status=status.HTTP_200_OK,
            content_type="application/json"
        )


def assign_multiple_user_to_task(user_ids, research_task: ResearchProjectTask):
    """
    Assign multiple user to the task pass array of ids and research_task instance
    """
    assigned_users = User.objects.filter(id__in=[research_task.task_creator_id, *user_ids])
    research_project_task = ResearchProjectTask.objects.get(id=research_task.id)

    # check existing users in assigned user model
    existing_assigned_users = ResearchProjectTaskAssignedUser.objects.filter(
        research_project_task=research_project_task,
        assigned_user__in=assigned_users
    )

    # Create new objects only for users that do not already exist
    new_assigned_users = [
        ResearchProjectTaskAssignedUser(
            research_project_task=research_project_task,
            assigned_user=assigned_user,
        ) for assigned_user in assigned_users
        if assigned_user.id not in existing_assigned_users.values_list('assigned_user', flat=True)
    ]
    ResearchProjectTaskAssignedUser.objects.bulk_create(new_assigned_users)


class ResearchTaskController(APIView):
    """Return the task details"""
    permission_classes = [IsAuthenticated]

    def get(self, request, research_task_id):
        is_task_owner = False
        task = get_object_or_404(ResearchProjectTask, id=research_task_id)

        if request.user.id == task.task_creator_id or request.user.id == task.research_project_id:
            is_task_owner = True

        uploaded_files = ResearchProjectTaskFile.objects.filter(parent_task=task)

        protocol_files = []
        submitted_files = []
        user_permissions = {}

        potentially_assigned_user = ResearchProjectTaskAssignedUser.objects.filter(
            assigned_user=request.user.id, research_project_task_id=research_task_id
        )
        extra_params_dict = dict(is_assigned=potentially_assigned_user.exists())

        if potentially_assigned_user.exists():
            extra_params_dict['current_assigned_user_data'] = potentially_assigned_user.first().to_json()

        project_permissions = ResearchProjectParticipant.objects.filter(
            study_id=task.research_project_id, user_id=request.user.id
        )

        if project_permissions.exists():
            user_permissions = project_permissions.first().to_json()
            if request.user.is_staff and request.user.is_superuser:
                user_permissions['is_admin'] = True
            extra_params_dict['user_permissions'] = user_permissions

        is_lead_pi = user_permissions.get('is_principal_investigator') or user_permissions.get('is_project_lead')

        # send submitted files based on the role and permission level
        for file in uploaded_files:
            if file.is_protocol_file:
                protocol_files.append(file.to_json())
            elif is_task_owner or is_lead_pi or not task.hide_submitted_files:
                submitted_files.append(file.to_json())

        user_profile_info = {
            'task': task.to_json(),
            'is_task_owner': is_task_owner,
            'task_creator': task.task_creator.get_full_name(),
            'project_lead': task.research_project.creator.get_full_name(),
            'roles_required': task.roles_needed,
            'members': task.get_all_members_for_task(),
            'uploaded_files': protocol_files,
            'submitted_files': submitted_files,
            **extra_params_dict
        }

        serialized_data = ResearchTaskSerializer(user_profile_info)

        return Response(data=serialized_data.data, status=status.HTTP_200_OK)


class SubmitResearchTaskController(APIView):
    permission_classes = [RequireProjectTaskAssigned, IsProjectNotArchived]

    def patch(self, request, project_id: int, task_id: int):
        # Update the task submission with the request data after serializing and validating
        assigned_user_data = dict(
            assigned_user=request.user.id,
            research_project_task=task_id,
            # is_complete data is included in the request data
            **request.data
        )
        serialized_data = ResearchProjectTaskAssignedUserSerializer(
            instance=request.research_project_task_assigned_user, data=assigned_user_data
        )
        if serialized_data.is_valid():
            serialized_data.save()
            return Response(
                content_type="application/json",
                data=SuccessSerializer(dict(success="You have submitted your task!")).data,
                status=status.HTTP_200_OK
            )
        return Response(
            content_type="application/json",
            data=ErrorSerializer(dict(error="Could not submit the task")).data,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class FinalizeResearchTaskController(APIView):
    # PIs, the project lead or the task creator can finalize the task
    permission_classes = [RequireProjectMembership, IsProjectNotArchived]

    def patch(self, request, project_id: int, task_id: int):
        user_permissions = {}
        task_instance = ResearchProjectTask.objects.get(id=task_id)

        project_permissions = ResearchProjectParticipant.objects.filter(
            study_id=project_id, user_id=request.user.id
        )

        if project_permissions.exists():
            user_permissions = project_permissions.first().to_json()

        is_lead_pi = user_permissions.get('is_principal_investigator') or user_permissions.get('is_project_lead')
        is_task_creator = task_instance.task_creator_id == request.user.id

        if is_lead_pi or is_task_creator:
            task_instance.is_complete = True
            task_instance.save()

            return Response(
                content_type="application/json",
                data=SuccessSerializer(dict(success="You have finalized your task!")).data,
                status=status.HTTP_200_OK
            )


def get_formatted_due_date(task):
    if task.is_using_due_date:
        if task.due_date_type == DateTypes.EXACT_DATE.value:
            return task.due_date
        elif task.due_date_type == DateTypes.MONTH_YEAR.value:
            return task.due_date.strftime("%B, %Y")
        elif task.due_date_type == DateTypes.DAY_MONTH.value:
            return task.due_date.strftime("%d %B")


def send_incomplete_task_email(user, task, project):
    incomplete_task_params = {
        'user': user.get_full_name(),
        'taskOwner': task.task_creator.get_full_name(),
        'taskTitle': task.title,
        'projectTitle': project.title,
        'dueDateAvailable': task.is_using_due_date,
        'dueDate': get_formatted_due_date(task)
    }
    incomplete_task_email = EngageEmail(
        subject='Engage | Reminder for incomplete task',
        template_name=EmailTemplateConstants.PROMPT_USER_FOR_INCOMPLETE_TASK_EMAIL,
        template_params=incomplete_task_params
    )
    incomplete_task_email.set_recipients([user.email])
    incomplete_task_email.send()

    Notification.objects.create(
        receiver_id=user.id,
        source_id=project.id,
        content=f'A task owner has sent you a reminder about their task.',
        link=reverse('auth_app:react_project_details', args=[project.id]),
        type=NotificationTypes.PROJECT.value
    )


class PromptUserForIncompleteTask(APIView):
    permission_classes = [IsAuthenticated, RequireProjectTaskOwner, IsProjectNotArchived]

    def post(self, request, project_id, task_id, user_id):
        task = ResearchProjectTask.objects.get(id=task_id)
        user = User.objects.get(id=user_id)
        project = task.research_project

        send_incomplete_task_email(user, task, project)

        assigned_user_task = ResearchProjectTaskAssignedUser.objects.get(assigned_user=user.id,
                                                                         research_project_task=task.id)
        assigned_user_task.is_prompted = True
        assigned_user_task.prompted_date = datetime.datetime.now()
        assigned_user_task.save()

        return Response(
            SuccessSerializer(dict(success=f"Successfully prompted {user.get_full_name()} for this task.")).data,
            status=status.HTTP_200_OK, content_type="application/json"
        )


class PromptAllUsersForIncompleteTask(APIView):
    permission_classes = [IsAuthenticated, RequireProjectTaskOwner, IsProjectNotArchived]

    def post(self, request, project_id, task_id):
        task = ResearchProjectTask.objects.get(id=task_id)
        users = User.objects.filter(id__in=ResearchProjectTaskAssignedUser.objects.filter(
            research_project_task=task_id, is_complete=False).values('assigned_user'))
        project = task.research_project
        email_sent = False

        for user in users:
            assigned_user_task = ResearchProjectTaskAssignedUser.objects.get(assigned_user=user.id,
                                                                             research_project_task=task.id)
            if not assigned_user_task.is_prompted or assigned_user_task.prompted_date is None\
                    or assigned_user_task.prompted_date.date() != datetime.date.today():
                assigned_user_task.is_prompted = True
                assigned_user_task.prompted_date = datetime.datetime.now()
                assigned_user_task.save()
                email_sent = True
                send_incomplete_task_email(user, task, project)
        if email_sent:
            return Response(
                SuccessSerializer(dict(success=f"Successfully prompted all users for this task")).data,
                status=status.HTTP_200_OK, content_type="application/json"
            )
        else:
            if len(users) == 0:
                return Response(
                    SuccessSerializer(dict(success=f"There are no users with pending task.")).data,
                    status=status.HTTP_200_OK, content_type="application/json"
                )
            return Response(
                SuccessSerializer(
                    dict(success=f"All users have already been prompted today")).data,
                status=status.HTTP_200_OK, content_type="application/json"
            )


class AssignUserToResearchProjectTask(APIView):
    permission_classes = [RequireProjectMembership, RequireProjectTaskOwner, IsProjectNotArchived]

    def post(self, request, project_id, task_id):
        """Check if the user is on the project then using the request body from this post request we can assign
        the user specified in the data to this task. The user must be apart of the project before joining"""
        assigned_user_data = dict(
            research_project_task=task_id,
            **request.data
        )
        existing_user_permissions = ResearchProjectParticipant.objects.filter(
            user_id=assigned_user_data['assigned_user'], study_id=project_id
        )
        if not existing_user_permissions.exists():
            return Response(
                content_type="application/json",
                data=ErrorSerializer(dict(
                    error="Could not assign the task",
                    form_errors=dict(unique_user=["This user is not on the project"]))
                ).data,
                status=status.HTTP_400_BAD_REQUEST
            )

        serialized_data = ResearchProjectTaskAssignedUserSerializer(data=assigned_user_data)
        if serialized_data.is_valid():
            assigned_user_task = serialized_data.create(validated_data=dict(
                assigned_user=User.objects.get(id=assigned_user_data['assigned_user']),
                research_project_task=ResearchProjectTask.objects.get(id=task_id)
            ))

            return Response(
                content_type="application/json",
                data=SuccessSerializer(dict(
                    success=f"You have assigned your task to {assigned_user_task.assigned_user.get_full_name()}")
                ).data,
                status=status.HTTP_200_OK
            )
        return Response(
            content_type="application/json",
            data=ErrorSerializer(dict(error="Could not assign the task", form_errors=serialized_data.errors)).data,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, project_id, task_id):
        """Unassign a user from a research project task."""
        unassign_user = request.data.get('assigned_user')

        assigned_user = ResearchProjectTaskAssignedUser.objects.get(
            research_project_task=task_id,
            assigned_user=unassign_user
        )

        if assigned_user.research_project_task.task_creator.id == unassign_user:
            return Response(
                content_type="application/json",
                data=ErrorSerializer(dict(error="Could not unassign task owner", form_errors={})).data,
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            try:
                self_removal = False
                # get the task owner using the assigned user instance
                task_owner = assigned_user.research_project_task.task_creator

                user_task_files = ResearchProjectTaskFile.objects.filter(uploader_id__user=unassign_user,
                                                                         parent_task=task_id)

                user_task_files.delete()
                assigned_user.delete()
                # if assigned user is same as the user in request then it is a self removal from task
                if assigned_user.assigned_user == request.user:
                    self_removal = True
                    lead_user_ids = list(ResearchProjectParticipant.objects.filter(
                        Q(study_id=project_id) & (Q(is_project_lead=True) | Q(is_principal_investigator=True))
                    ).values_list('user_id', flat=True))
                    # append the task owner to lead ids
                    lead_user_ids.append(task_owner.id)
                    notifications = []
                    for user_id in lead_user_ids:
                        notification = Notification(
                            receiver_id=user_id,
                            source_id=project_id,
                            content=f"User: {assigned_user.assigned_user.get_full_name()} has been unassigned from the task",
                            link=reverse('auth_app:react_project_task_details', args=[task_id]),
                            type=NotificationTypes.PROJECT.value
                        )
                        notifications.append(notification)
                    # create the bundled notification
                    Notification.objects.bulk_create(notifications)
                else:
                    Notification.objects.create(
                        receiver=assigned_user.assigned_user,
                        source_id=project_id,
                        content=f"You have been unassigned from the task",
                        link=reverse('auth_app:react_project_task_details', args=[task_id]),
                        type=NotificationTypes.PROJECT.value
                    )

                response_message = "You have been unassigned from the task." if self_removal else f"You have unassigned {assigned_user.assigned_user.get_full_name()} from the task."

                return Response(
                    content_type="application/json",
                    data=SuccessSerializer(dict(success=response_message)).data,
                    status=status.HTTP_200_OK
                )
            except ResearchProjectTaskAssignedUser.DoesNotExist or ResearchProjectTaskFile.DoesNotExist:
                return Response(
                    content_type="application/json",
                    data=ErrorSerializer(dict(error="Could not unassign from the task", form_errors={})).data,
                    status=status.HTTP_400_BAD_REQUEST
                )
