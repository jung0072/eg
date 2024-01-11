from django.db.models import Q
from django.shortcuts import reverse
from django.db import transaction
import time

from django.contrib.auth.models import User
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK
from rest_framework.views import APIView

from api_app.serializers.general import ErrorSerializer, DataSerializer, SuccessSerializer
from api_app.serializers.research_project import ResearchProjectSerializer, ResearchProjectTableSerializer, \
    ResearchProjectUserMentionsSerializer, UserRecentResearchTaskSerializer, ResearchProjectCalendarReminderGetSerializer, \
    ResearchProjectCalendarReminderPostSerializer
from api_app.utils.permissions import RequireProjectMembership, RequiredRolesForProject, IsProjectNotArchived
from auth_app.models import UserProfile, ResearchInterest
from communication_app.models import UserMessageTag
from engage_app.forms import ResearchProjectForm
from engage_app.models import ResearchProjectParticipant, ResearchProjectTaskAssignedUser, ResearchProject, \
    ResearchProjectTask, ResearchProjectCalendarReminder, CalendarReminder, ResearchProjectQuestion, \
    ResearchProjectSection
from engage_app.utils import ResearchStudyReminderTypes
from communication_app.models import Notification
from communication_app.utils import NotificationTypes
from api_app.utils.common import delete_project


class UserResearchProjectInfoController(APIView):
    def get(self, request):
        if not request.user.id:
            return Response(
                data=dict(error="You are currently not authenticated"),
                content_type="application/json",
                status=status.HTTP_401_UNAUTHORIZED
            )

        profile = UserProfile.objects.filter(user_id=request.user.id)
        completed_project_list, incomplete_project_list = profile.first().get_list_of_user_research_projects_info(
            show_pending_invitations=True,
        )
        research_project_json_list = []
        for project in [*completed_project_list, *incomplete_project_list]:
            research_project_json_list.append({
                'permissions': project['permissions'],
                **project['research_project'],
            })

        serialized_data = ResearchProjectTableSerializer(research_project_json_list, many=True)
        return Response(
            data=dict(success="Research Project List Retrieved", data=serialized_data.data), status=status.HTTP_200_OK,
            content_type="application/json"
        )


# @login_required
class ResearchProjectTeamInfoController(APIView):
    def get(self, request, project_id):
        """Check the requesting users permissions for the team, if they are an approved team member then return the list
        of team members from this specific research project"""
        current_permissions = ResearchProjectParticipant.objects.filter(
            study_id=project_id, is_active=True, user_id=request.user.id
        )
        if current_permissions.exists():
            current_permissions = current_permissions.first()
            study_team_query = current_permissions.study.participants
            study_team_list = [permission.to_json() for permission in study_team_query]
            return Response(
                data=dict(success="Study team retrieved", data=study_team_list), status=status.HTTP_200_OK,
                content_type="application/json"
            )
        else:
            return Response(
                data=dict(error="You do not have the permissions to view this team"), content_type="application/json",
                status=status.HTTP_403_FORBIDDEN
            )


class ResearchProjectUserMentionsController(APIView):
    def get(self, request, project_id):
        if not request.user.id:
            return Response(
                data=dict(error="You are currently not authenticated"),
                content_type="application/json",
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Query all the user mentions based on the selected project id, discussion boards could be linked by the
        # research project task or by the research project
        current_user_mentions = UserMessageTag.objects.filter(user_id=request.user.id).filter(
            Q(message__discussion_board__research_project_id=project_id) |
            Q(message__discussion_board__parent_task__research_project_id=project_id)
        )
        # Create the list of current user mentions by converting each mention to json
        current_user_mentions_list = [mention.to_json() for mention in current_user_mentions]
        # Serialize the data and return the current user mentions to the requesting user
        serialized_data = ResearchProjectUserMentionsSerializer(current_user_mentions_list, many=True)
        return Response(data=serialized_data.data, content_type="application/json", status=200)


class UserRecentResearchTasksController(APIView):
    def get(self, request, project_id):
        if not request.user.id:
            return Response(
                data=dict(error="You are currently not authenticated"),
                content_type="application/json",
                status=status.HTTP_401_UNAUTHORIZED
            )
        # Query all the recent research tasks for the user based on the selected project id
        recent_research_tasks = ResearchProjectTaskAssignedUser.objects.filter(
            assigned_user_id=request.user.id, research_project_task__research_project_id=project_id
        )
        # Create a dict of the project permissions and the task details
        recent_research_tasks_list = [
            dict(
                task=rrt.research_project_task.to_json(),
                assigned_user_info=rrt.to_json()
            ) for rrt in recent_research_tasks
        ]
        # Serialize the recent research task data and return it to the user
        serialized_data = UserRecentResearchTaskSerializer(recent_research_tasks_list, many=True)
        return Response(data=serialized_data.data, content_type="application/json", status=200)


def update_custom_project_fields(request_data: dict, research_project: ResearchProject):
    # Save the research interests to the project
    if 'research_interests' in request_data:
        for interest_id in request_data['research_interests']:
            research_interest = ResearchInterest.objects.filter(id=interest_id)
            if research_interest.exists() and research_interest not in research_project.research_interests.all():
                research_project.research_interests.add(research_interest.first())
        research_project.save()

    # Add the main contact if they were supplied
    if "main_contact" in request_data:
        main_contact_user = User.objects.filter(id=request_data['main_contact'])
        if main_contact_user.exists():
            research_project.main_contact = main_contact_user.first()
            research_project.save()


class ResearchProjectInfoController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        research_project = ResearchProject.objects.filter(id=project_id)
        if research_project.exists():
            serialized_data = ResearchProjectSerializer(research_project.first(), current_user=request.user)
            return Response(
                content_type="application/json", status=status.HTTP_200_OK,
                data=serialized_data.data
            )
        return Response(
            content_type="application/json", status=status.HTTP_404_NOT_FOUND,
            data=ErrorSerializer(dict(error="This research project does not exist")).data
        )

    def post(self, request):
        request.data['project_creator_id'] = request.user.id
        alternate_lead_id = request.data.pop('alternate_lead', None)
        principal_investigators = request.data.pop('principal_investigators', None)
        research_project_form = ResearchProjectForm(
            request.data, project_creator_id=request.user.id, instance=None, alternate_lead=alternate_lead_id,
            principal_investigators=principal_investigators
        )
        # Validate the form data and if it is valid create the project otherwise return the form errors
        if research_project_form.is_valid():
            new_project = research_project_form.save()
            update_custom_project_fields(request.data, new_project)
            # Send a notification to this user telling them they have been added to the project
            if principal_investigators:
                notifications = []
                for principal_investigator in principal_investigators:
                    notification = Notification(
                        receiver_id=principal_investigator,
                        source_id=new_project.id,
                        content='You have been invited to join a research project as a Principal Investigator',
                        link=reverse('auth_app:react_project_details', args=[new_project.id]),
                        type=NotificationTypes.PROJECT.value
                    )
                    notifications.append(notification)
                # create the bundled notification
                Notification.objects.bulk_create(notifications)

            serialized_data = ResearchProjectSerializer(new_project)
            return Response(
                content_type="application/json", status=status.HTTP_201_CREATED, data=serialized_data.data
            )
        error_response = ErrorSerializer(dict(error="Could not save form", form_errors=research_project_form.errors))
        return Response(
            content_type="application/json", status=status.HTTP_400_BAD_REQUEST,
            data=error_response.data
        )


class ResearchProjectController(APIView):
    def get_permissions(self):
        # If the request method is DELETE
        if self.request.method == 'DELETE':
            # If the user is an admin then we only need the one permissions class for IsAdminUser()
            if self.request.user.is_superuser and self.request.user.is_staff:
                return [IsAdminUser()]

            # Return IsAuthenticated permission and RequiredRolesForProject with only 'is_project_lead' allowed role
            # reason for IsAuthenticated():https://stackoverflow.com/questions/37097910/has-permission-missing-1-required-positional-argument-view
            return [IsAuthenticated(), RequiredRolesForProject(['is_project_lead'])]
        else:
            # For all other request methods
            # Return IsAuthenticated permission and RequiredRolesForProject with both 'is_project_lead' and
            # 'is_principal_investigator' allowed roles
            return [IsAuthenticated(), RequiredRolesForProject(['is_project_lead', 'is_principal_investigator'])]

    def patch(self, request, project_id):
        """Update the project specified by the project id"""
        existing_project = ResearchProject.objects.filter(id=project_id)
        form_errors = None
        if existing_project.exists():
            existing_project = existing_project.first()
            # If the submit for review event is seen, submit the project for approval
            if 'submit_for_review' in request.data:
                is_ready_for_review = request.data.pop('submit_for_review', False)
                existing_project.save_answers({}, is_ready_for_review)
                response_data = SuccessSerializer(dict(success="You submitted your project for approval")).data
                return Response(
                    content_type="application/json", status=status.HTTP_201_CREATED, data=response_data
                )
            alternate_lead_id = request.data.pop('alternate_lead', None)
            updated_form_data = {**existing_project.to_form_values(), **request.data}
            research_project_form = ResearchProjectForm(
                updated_form_data, project_creator_id=existing_project.creator_id, instance=existing_project,
                alternate_lead=alternate_lead_id
            )
            # Process the demographics sub-forms first, then return a response to avoid override values
            if "demographics_form" in request.data:
                existing_project.save_answers(request.data['demographics_form'], False)
                response_data = SuccessSerializer(
                    dict(success="You have updated the project demographic settings")
                ).data
                return Response(content_type="application/json", status=status.HTTP_200_OK, data=response_data)

            # Now process the base research project form by adding
            if research_project_form.is_valid():
                updated_project = research_project_form.save()
                serialized_data = ResearchProjectSerializer(updated_project)
                update_custom_project_fields(updated_form_data, updated_project)

                return Response(
                    content_type="application/json", status=status.HTTP_201_CREATED, data=serialized_data.data
                )

            form_errors = research_project_form.errors
        return Response(
            content_type="application/json", status=status.HTTP_400_BAD_REQUEST,
            data=ErrorSerializer(dict(error="Could not save research project.", form_errors=form_errors)).data
        )

    def delete(self, request, project_id=None):
        """Delete a project and all related objects except [models_not_to_delete]"""
        try:
            project_id = request.data.get('project_id')
            success = delete_project(project_id)
            if success:
                return Response(
                    data=SuccessSerializer(dict(success='You have successfully deleted the project')).data,
                    status=status.HTTP_200_OK,
                    content_type="application/json"
                )
            else:
                return Response(
                    data=ErrorSerializer(dict(
                        error="Could not delete the selected project",
                        form_errors=dict(could_not_delete=['Failed to delete the project and related objects.'])
                    )).data,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content_type="application/json"
                )
        except Exception as project_deletion_error:
            return Response(
                data=ErrorSerializer(dict(
                    error="Could not delete the selected project",
                    form_errors=dict(could_not_delete=['Failed to delete the project and related objects.'])
                )).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )


class ResearchProjectPartners(APIView):
    # TODO: add the class that only creator can access it, I will believe this should be removed as this is part of the project
    # and data should be retrieved from there
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        # include members that are active or not on the project
        include_all = self.request.query_params.get('includeAll')
        project_participants = ResearchProjectParticipant.get_project_active_user(project_id, include_all)

        return Response(project_participants, status=200)


class ResearchProjectCalendarReminderController(APIView):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # if it a get method we allow project members to have access 
        # to it else only specific roles can update or delete
        if self.request.method == 'GET':
            return [RequireProjectMembership()]
        else:
            return [RequiredRolesForProject(['is_project_lead', 'is_principal_investigator']), IsProjectNotArchived()]

    def get(self, request, project_id):
        reminders = ResearchProjectCalendarReminder.objects.filter(research_project_id=project_id)
        serialized_types = ResearchProjectCalendarReminderGetSerializer(reminders, many=True)
        return Response(data=serialized_types.data, status=HTTP_200_OK, content_type="application/json")

    def post(self, request, project_id):
        project = ResearchProject.objects.get(id=project_id)
        # To validate the data we first have to send the id's to the serializer
        modified_request_data = dict(creator=request.user.id, research_project=project_id, **request.data)
        reminder_type = None

        if "reminder_type" in modified_request_data:
            reminder_type = CalendarReminder.objects.filter(
                type=ResearchStudyReminderTypes[modified_request_data["reminder_type"]].name
            ).first()
            modified_request_data["calendar_reminder"] = reminder_type.id

        serialized_data = ResearchProjectCalendarReminderPostSerializer(data=modified_request_data)

        if serialized_data.is_valid():
            # once the data is validated we can set the actual objects to the data before creating the new reminder
            modified_request_data['calendar_reminder'] = reminder_type
            modified_request_data["creator"] = request.user
            modified_request_data["research_project"] = project
            if "research_task" in modified_request_data:
                modified_request_data['research_task'] = ResearchProjectTask.objects.get(
                    id=modified_request_data['research_task']
                )

            # remove any extra custom fields before creating
            modified_request_data.pop("reminder_type")
            serialized_data.create(validated_data=modified_request_data)

            if "research_interests" in modified_request_data:
                research_project = request.project
                research_project.research_interests.set(modified_request_data['research_interests'])
                research_project.save()
            return Response(content_type="application/json", status=status.HTTP_200_OK, data=serialized_data.data)
        return Response(
            content_type="application/json", status=status.HTTP_400_BAD_REQUEST,
            data=ErrorSerializer(dict(
                error="Could not save research project reminder", form_errors=serialized_data.errors
            )).data
        )

    def delete(self, request, project_id):
        # get the reminder_id from request data, using atomic delete reminder so that if it fails we can fallback to original state
        reminder_id = request.data.get('reminder_id')
        try:
            with transaction.atomic():
                # Delete the Reminder
                ResearchProjectCalendarReminder.objects.get(id=reminder_id, research_project_id=project_id).delete()

        except Exception as reminder_deletion_error:
            return Response(
                data=ErrorSerializer(dict(
                    error="Could not delete the selected reminder",
                    form_errors=dict(could_not_delete=['Failed to delete reminder and related objects'])
                )).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )
        return Response(
            data=SuccessSerializer(dict(success='You have successfully deleted the reminder')).data,
            status=status.HTTP_200_OK,
            content_type="application/json"
        )

    def patch(self, request, project_id):
        # get the requested id for the reminder which needs to be updated
        reminder_id = request.data.get('reminder_id')
        try:
            # get the reminder instance
            reminder = ResearchProjectCalendarReminder.objects.filter(id=reminder_id, research_project_id=project_id).first()
            # Prepare modified reminder data based on request data
            modified_reminder = dict(creator=request.user.id, research_project=project_id, **request.data)
            # Check if "reminder_type" is in the modified reminder data
            if "reminder_type" in modified_reminder:
                # Get the corresponding CalendarReminder type
                reminder_type = CalendarReminder.objects.filter(
                    type=ResearchStudyReminderTypes[modified_reminder["reminder_type"]].name
                ).first()
            # Update the calendar_reminder with the corresponding type
            modified_reminder["calendar_reminder"] = reminder_type.id

            serialized_data = ResearchProjectCalendarReminderPostSerializer(data=modified_reminder)

            if serialized_data.is_valid():
                # if serialized data is valid, update the rest of the fields with model instances
                modified_reminder['calendar_reminder'] = reminder_type
                modified_reminder['creator'] = request.user
                modified_reminder['research_project'] = reminder.research_project
                research_task_id = reminder.research_task_id
                research_task_instance = reminder.research_task
                # if a research task is not attached to it then set instance to None else, set the instance for research task
                if not "research_task" in modified_reminder:
                    research_task_instance=None
                if "research_task" in modified_reminder and modified_reminder['research_task'] != research_task_id:
                    research_task_instance = ResearchProjectTask.objects.get(
                        id=modified_reminder['research_task']
                    )
                modified_reminder['research_task'] = research_task_instance
                # update the reminder
                serialized_data.update(reminder, validated_data=modified_reminder)

                return Response(
                    data=SuccessSerializer(dict(success='You have successfully updated the reminder')).data,
                    status=HTTP_200_OK,
                    content_type="application/json"
                )
        except ResearchProjectCalendarReminder.DoesNotExist:
            return Response(
                data=ErrorSerializer(dict(error="Could not update the selected reminder, please try again")).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )


class ResearchProjectFormController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id=None):
        # Iterate through all the sections, for each section iterate through each question to build a list
        # of the render chan json and the section data to return to the user to build the form
        all_sections = ResearchProjectSection.objects.all().order_by('order_number')
        section_data_list = []
        question_data_list = []
        for section in all_sections:
            section_questions = ResearchProjectQuestion.objects.filter(section=section)
            section_data_list.append(dict(**section.to_json()))
            for question in section_questions:
                question_data_list.append(question.get_render_chan_json)
        response_data = dict(sections=section_data_list, question_data=question_data_list)
        serialized_data = DataSerializer(dict(data=response_data))
        return Response(data=serialized_data.data, status=status.HTTP_200_OK, content_type="application/json")


class ApprovedResearchProjectController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # First get a list of all the approved projects from the system
        approved_projects = ResearchProject.objects.filter(is_approved=True, is_public=True)

        # Next build a list of all the private projects on the system that this user is apart of
        users_private_projects = list(ResearchProjectParticipant.objects.filter(
            user=request.user, study__is_public=False
        ).exclude(study_id__in=approved_projects).values_list('study_id', flat=True))

        # Finally get query all the remaining projects and send the JSON response to the user
        approved_projects = approved_projects | ResearchProject.objects.filter(id__in=users_private_projects)
        response_data = ResearchProjectTableSerializer(
            [project.to_table_json(add_tasks=True) for project in approved_projects], many=True
        )
        return Response(data=response_data.data, content_type="application/json", status=status.HTTP_200_OK)
