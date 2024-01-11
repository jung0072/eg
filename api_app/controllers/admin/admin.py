import datetime
import random
import string
import io

from background_task.models import Task
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.shortcuts import reverse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from aws_s3_provider.S3Service import S3Service

from auth_app.utils.common import get_run_at
from auth_app.utils.constants import BACKGROUND_TASKS_NAME, BACKGROUND_TASK_DURATIONS
from auth_app.views.schedule_background_tasks import create_notification_email_background_tasks
from config import settings
from datetime import timedelta

from api_app.serializers import ErrorSerializer, ResearchProjectSerializer, SuccessSerializer, UserProfileSerializer, \
    ProjectsManagementSerializer, ChatLogsSerializer, SystemSettingsSerializer
from auth_app.models import UserProfileAnswer, UserProfile, AdminSettings
from api_app.utils.permissions import RequireAdmin
from auth_app.views.serializers.user_serializer import PendingResearcherSerializer
from engage_app.models import ResearchProject, ResearchProjectTask, ResearchProjectParticipant, ResearchProjectTask
from engage_app.utils import EngageFileCategory
from communication_app.models import Notification, Message, DiscussionBoard
from communication_app.utils import NotificationTypes
from email_app.utils import EngageEmail, EmailTemplateConstants
from api_app.utils.common import delete_project


def get_pending_researchers_dict():
    # Get a list of all the pending researcher profiles and return the json list of those researcher values
    # along with any other items needed for review like submission date
    pending_researcher_profiles = UserProfile.get_pending_researchers()
    pending_researchers_list = []
    for pending_researcher in pending_researcher_profiles:
        pending_researchers_list.append({
            **pending_researcher.to_json(),
            'researcher_form_review_date': pending_researcher.researcher_form_review_date,
            # commented out because clinical area is not posted at the time.
            'research_interests': pending_researcher.get_research_interests_text(),
        })
    return dict(
        pending_researchers=pending_researchers_list
    )


class PendingResearchers(APIView):
    permission_classes = [IsAuthenticated, RequireAdmin]

    def get(self, request):
        user = request.user

        response_data = dict(
            admin=dict(
                username=user.username,
                id=user.id
            ),
            **get_pending_researchers_dict()
        )

        pending_researchers_data = PendingResearcherSerializer(response_data)

        return Response(data=pending_researchers_data.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Approve a pending researcher to the system and give them access to features like the patient directory"""
        # Check if the user exists and if the user is a researcher that is unapproved
        researcher_id = request.data['researcher_id']
        current_user_profile = UserProfile.objects.filter(user_id=researcher_id)
        if not current_user_profile.exists() or not current_user_profile.first().is_researcher():
            return Response(data=dict(error="This user does not need to be updated"),
                            status=status.HTTP_400_BAD_REQUEST)

        current_user_profile = current_user_profile.first()
        # Now check if the user is already approved, if not modify the appropriate values
        if not current_user_profile.is_active_researcher:
            current_user_profile.is_pending_researcher = False
            current_user_profile.is_active_researcher = True
            current_user_profile.is_researcher_form_ready_for_review = False
            current_user_profile.save()

            # Send a notification to the approved researcher
            Notification.objects.create(
                receiver_id=researcher_id,
                source_id=researcher_id,
                content="You have now been approved to the system. You can now create projects and join projects.",
                link=reverse('auth_app:react_user_profile', args=[researcher_id]),
                type=NotificationTypes.USER.value
            )
            return Response(data=dict(
                success="Success we have updated the current user", user=current_user_profile.user.first_name
            ), status=status.HTTP_200_OK)
        return Response(
            data=dict(error="This was not a valid request, please try again later or contact the admin"),
            status=status.HTTP_400_BAD_REQUEST
        )


class PendingResearchProjectController(APIView):
    permission_classes = [IsAuthenticated, RequireAdmin]

    def get(self, request):
        research_projects = ResearchProject.objects.filter(is_ready_for_review=True, is_approved=False)
        response_data = ResearchProjectSerializer(research_projects, many=True)
        return Response(data=response_data.data, content_type="application/json", status=status.HTTP_200_OK)

    def post(self, request):
        project_id = request.data['project_id']
        research_project = ResearchProject.objects.filter(id=project_id)
        if not research_project.exists():
            return Response(
                content_type="application/json", status=status.HTTP_400_BAD_REQUEST,
                data=ErrorSerializer(dict(error="This project does not exist"))
            )
        research_project = research_project.first()
        if not research_project.is_approved:
            research_project.is_approved = True
            research_project.is_ready_for_review = False
            research_project.save()

            # Send a notification to the approved project_creator
            Notification.objects.create(
                receiver_id=research_project.creator_id,
                source_id=request.user.id,
                content=f"Your research project {research_project.reference_name} has now been approved. Users can now see your project in the project directory and you can invite/accept partners to the project. You can also specify demographics of partners you are seeking by editing your project",
                link=reverse('auth_app:react_project_details', args=[research_project.id]),
                type=NotificationTypes.USER.value
            )
            return Response(
                SuccessSerializer(dict(success="You have updated the research project, it is now approved")).data,
                status=status.HTTP_200_OK, content_type="application/json"
            )
        return Response(
            content_type="application/json", status=status.HTTP_400_BAD_REQUEST,
            data=ErrorSerializer(dict(error="This is not a valid request"))
        )


class UserManagement(APIView):
    permission_classes = [IsAuthenticated, RequireAdmin]

    def get(self, request):
        """Get all the users on the system and exclude any admins"""
        system_users = User.objects.select_related('userprofile').all().exclude(is_superuser=True).order_by('id')
        serialized_data = UserProfileSerializer(system_users, many=True)
        return Response(data=serialized_data.data, status=status.HTTP_200_OK, content_type="application/json")

    def delete(self, request):
        """ Delete the user data from the database completely including projects, tasks and messages."""
        try:
            with transaction.atomic():
                # Get a reference to the user first and the projects they have created
                user = User.objects.get(id=request.data.get('user_id'))
                user_project_list = ResearchProject.objects.filter(creator=user)
                user_project_id_list = list(user_project_list.values_list('id', flat=True))

                # Delete all the notifications associated with this user and their projects
                Notification.objects.filter(
                    type=NotificationTypes.PROJECT.value, source_id__in=user_project_id_list
                ).delete()
                Notification.objects.filter(type=NotificationTypes.USER.value, source_id=user.id).delete()

                # now delete the projects and then the user
                user_project_list.delete()
                user.delete()

        except Exception as user_deletion_error:
            return Response(
                data=ErrorSerializer(dict(
                    error="Could not delete the selected user",
                    form_errors=dict(could_not_delete=['Failed to delete user profile and related objects.'])
                )).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )
        return Response(
            data=SuccessSerializer(dict(success='You have successfully deleted the user')).data,
            status=status.HTTP_200_OK,
            content_type="application/json"
        )

    def patch(self, request):
        """Change user role, and delete their userprofile answers"""
        # TODO: Use clean to delete research interests of the user

        user_profile = UserProfile.objects.filter(user_id=request.data.get('user_id'))
        new_role = request.data.get('user_role')
        # If the user exists, set the new role and save the user
        if user_profile.exists():
            user_profile_answers = UserProfileAnswer.objects.filter(user_profile_id=request.data.get('user_id'))
            user_profile_answers.delete()
            user_profile = user_profile.first()
            user_profile.role = new_role
            user_profile.save()
            success_serializer = SuccessSerializer(dict(success='We have successfully changed this users role.'))
            return Response(data=success_serializer.data, status=status.HTTP_200_OK, content_type="application/json")
        else:
            error_serializer = ErrorSerializer(
                dict(error='User not found', form_errors=(dict(not_found=["The selected user was not found"])))
            )
            return Response(
                data=error_serializer.data, status=status.HTTP_404_NOT_FOUND, content_type="application/json"
            )


class ResetUserPasswordAdmin(APIView):

    def patch(self, request, user_id):
        # get the admins for email and user account that requires password reset.
        user_accounts = User.objects.filter(Q(id=user_id) | Q(is_staff=True, is_superuser=True))
        # filter out the user from accounts list that require password reset
        user_to_reset_password = user_accounts.filter(id=user_id)
        if user_to_reset_password.exists():
            # create the password
            user_account = user_to_reset_password.first()
            new_password = User.objects.make_random_password(15)

            # check for the password criteria generated by make_random_password, should include 1 uppercase
            # and 1 symbol
            if not self.password_meets_criteria(new_password):
                # if it doesn't meet the criteria add symbol and number
                new_password = self.add_symbol_and_number(new_password)

            # set the password
            user_account.set_password(new_password)
            user_account.save()

            # send an email to the admin as well as to the user

            # Email to the user whose password is being reset
            user_reset_email_params = {
                'user': user_account,
                'new_password': new_password,
                'admin': True,
            }
            user_reset_email = EngageEmail(
                subject='Your Password Has Been Reset',
                template_name=EmailTemplateConstants.USER_NEW_PASSWORD_RESET,
                template_params=user_reset_email_params
            )
            # Set recipients for the user whose password is being reset
            user_reset_email.set_recipients([user_account.email])
            user_reset_email.send()

            # Email to the admins
            admin_accounts = user_accounts.filter(is_staff=True, is_superuser=True)
            admins_email_params = {
                'user': user_account,
                'admin': True,
            }
            admins_email = EngageEmail(
                subject=f'Password Reset Confirmation - User: {user_account.username}',
                template_name=EmailTemplateConstants.ADMIN_RESET_PASSWORD,
                template_params=admins_email_params
            )

            # Set recipients for all admins
            admins_email.set_recipients(to=list(admin_accounts.values_list('email', flat=True)))
            admins_email.send()

            return Response(
                SuccessSerializer(dict(
                    success="The password has been reset successfully. You will also receive a confirmation email shortly.")).data,
                status=status.HTTP_200_OK,
                content_type="application/json"
            )
        return Response(
            data=ErrorSerializer(dict(error='Bad request')).data,
            status=status.HTTP_400_BAD_REQUEST,
            content_type="application/json"
        )

    def password_meets_criteria(self, password):
        # Check if password meets the criteria 1 uppercase and 1 symbol
        has_uppercase = any(c.isupper() for c in password)
        has_symbol = any(c in string.punctuation for c in password)
        return has_uppercase and has_symbol

    def add_symbol_and_number(self, password):
        # Add a random symbol and number to the password
        symbols = "!@#$%^&*"
        numbers = string.digits

        if not any(c in symbols for c in password):
            password += random.choice(symbols)
        if not any(c.isdigit() for c in password):
            password += random.choice(numbers)

        return password


class ProjectManagement(APIView):
    permission_classes = [IsAuthenticated, RequireAdmin]

    def get(self, request):
        """Get all the projects on the system"""
        research_projects = ResearchProject.objects.all()
        serializer = ProjectsManagementSerializer(research_projects, many=True)
        return Response(data=serializer.data, status=status.HTTP_200_OK, content_type="application/json")

    def delete(self, request):
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


class GetChatLogs(APIView):
    permission_classes = [IsAuthenticated, RequireAdmin]

    def get(self, request, project_id):
        """Get all the chat logs related to the project"""
        task_connected_to_the_project_ids = list(
            ResearchProjectTask.objects.filter(research_project_id=project_id).values_list("id", flat=True)
        )

        research_project = ResearchProject.objects.get(id=project_id)
        creator_full_name = research_project.creator.get_full_name()

        discussion_boards = DiscussionBoard.objects.filter(
            Q(parent_task_id__in=task_connected_to_the_project_ids) | Q(research_project_id=project_id)
        ).order_by('-updated_at')
        discussion_board_ids = list(discussion_boards.values_list('id', flat=True))

        chat_logs = []
        for discussion_board_id in discussion_board_ids:
            chat_logs.extend(Message.objects.filter(
                discussion_board_id=discussion_board_id
            ).order_by('-created_at'))

        chat_log_serializer = ChatLogsSerializer(chat_logs, many=True)

        fullname_of_senders = {}
        for chat_log in chat_log_serializer.data:
            fullname_of_senders[chat_log['sender_id']] = User.objects.get(id=chat_log['sender_id']).get_full_name()

        filename = f"{research_project.id}_{research_project.reference_name}_{creator_full_name}.txt"

        chatLogTextFileBuffer = GetChatLogs.create_text_file_buffer(
            research_project=research_project, creator_full_name=creator_full_name,
            discussion_boards=discussion_boards, discussion_board_ids=discussion_board_ids,
            senders=fullname_of_senders, chatLogs=chat_log_serializer.data
        )

        link = GetChatLogs.upload_buffer_to_s3_and_return_download_link(
            filename=filename, buffer=chatLogTextFileBuffer, created_at=research_project.created_at
        )

        GetChatLogs.send_email(link, project_id, research_project.reference_name, creator_full_name)

        return Response(status=status.HTTP_200_OK, content_type="application/text")

    @staticmethod
    def create_text_file_buffer(**kwargs):
        research_project = kwargs['research_project']
        creator_full_name = kwargs['creator_full_name']
        discussion_boards = kwargs['discussion_boards']
        discussion_board_ids = kwargs['discussion_board_ids']
        senders = kwargs['senders']
        project_chat_logs = kwargs['chatLogs']

        buffer = io.StringIO()

        def write_discussion_board_details(discussion_board_id):
            # Write discussion board details.
            discussion_board = discussion_boards.get(id=discussion_board_id)
            buffer.write(
                f"DISCUSSION - ChatRoomCode:{discussion_board.chat_room_code} - Creator(ID):{creator_full_name}({discussion_board.board_creator_id}) - Title:{discussion_board.display_title} - Last Updated:{discussion_board.updated_at}\n\n")

        def write_discussion_board_chat_logs(discussion_board_id, chat_log_count):
            # When there is no chat log in the discussion board.
            if len(project_chat_logs) == 0:
                buffer.write("No messages in this discussion board.")
                return chat_log_count

            # Write chat logs in the discussion board.
            discussion_board = discussion_boards.get(id=discussion_board_id)
            while True:
                chat_log = project_chat_logs[chat_log_count]
                sender_id = chat_log["sender_id"]
                created_at = chat_log["created_at"]
                content = chat_log["content"].strip()
                picture_link = chat_log["picture_link"]
                discussion_board_id = chat_log["discussion_board_id"]
                is_deleted = 'DELETED' if chat_log['is_deleted'] else ''

                if discussion_board_id != discussion_board.id:
                    buffer.write("\n\n")
                    break
                else:
                    buffer.write(
                        f"{senders[sender_id]} - {is_deleted} - {created_at} - {content}{' - ' + picture_link if picture_link else ''}\n"
                    )

                if chat_log_count >= len(project_chat_logs) - 1:
                    break
                else:
                    chat_log_count += 1
            return chat_log_count

        # Write the research project detail.
        buffer.write(
            f"Research Project ID:{research_project.id} - Title:{research_project.reference_name} - Creator:{creator_full_name}\n\n\n"
        )

        # Repeat writing Discussion Board details first and then chat logs.
        chatLogCount = 0
        for discussion_board_id in discussion_board_ids:
            write_discussion_board_details(discussion_board_id)
            chatLogCount = write_discussion_board_chat_logs(discussion_board_id, chatLogCount)

        return buffer

    @staticmethod
    def upload_buffer_to_s3_and_return_download_link(filename, buffer, created_at):
        file_key = f'{EngageFileCategory.ADMIN.name}/{created_at}/{filename}'

        # Convert the string buffer to bytes since the upload_file method only accepts bytes.
        byte_buffer = io.BytesIO(buffer.getvalue().encode())

        # Set the file buffer's position to the beginning of the file
        byte_buffer.seek(0)

        S3Service(settings.AWS_S3_BUCKET).upload_file(
            file_key=file_key,
            file_obj=byte_buffer,
        )

        return S3Service(settings.AWS_S3_BUCKET).get_download_link(file_key)

    @staticmethod
    def send_email(link, project_id, project_title, creator_full_name):
        user_ids = ResearchProjectParticipant.objects.filter(study_id=project_id).values_list('user_id', flat=True)
        user_emails = list(User.objects.filter(id__in=user_ids).values_list('email', flat=True))

        email_template_params = {
            'to_users': user_ids,
            'link': link,
            'project_title': project_title,
            'creator': creator_full_name,
        }

        email = EngageEmail(
            subject=f'Engage | Chat Logs Download Link',
            template_name=EmailTemplateConstants.DOWNLOAD_CHAT_LOGS,
            template_params=email_template_params
        )
        email.set_recipients(user_emails)
        email.send()


class SystemSettingsManagement(APIView):
    permission_classes = [RequireAdmin]

    def get(self, request):
        """ Get all the system settings """
        system_settings = AdminSettings.objects.all()

        system_settings_serializer = SystemSettingsSerializer(system_settings, many=True)
        admin_settings = []
        for data in system_settings_serializer.data:
            # We do not need periodic Email repetitions to be on the screen, It is more of a setting
            # based on Background task durations.
            if data['name'] != 'Periodic Emails Repetition':
                if data['name'] == BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value:
                    data['enabled'] = not AdminSettings.objects.get(
                        name=BACKGROUND_TASKS_NAME.PERIODIC_EMAILS_ENABLED.value).bool_value
                admin_settings.append(data)
        return Response(data=admin_settings, status=status.HTTP_200_OK,
                        content_type="application/json")

    def patch(self, request):
        """ Update the system settings """
        setting_name = request.data.get("name")
        new_value = request.data.get("value")

        try:
            system_setting = AdminSettings.objects.get(name=setting_name)
        except AdminSettings.DoesNotExist:
            return Response({"error": "Setting not found"}, status=status.HTTP_404_NOT_FOUND)

        data_type = system_setting.data_type
        field_to_update = None

        # Dictionary mapping data_type to field names
        field_map = {
            "Boolean": "bool_value",
            "Integer": "int_value",
            "Text": "text_value",
            "Datetime": "date_value",
            "Select": "selected_value"
        }

        # Determine the field to update based on the data_type
        field_to_update = field_map.get(data_type)

        current_value = getattr(system_setting, field_to_update)

        # Update the field with the new value and save the instance
        setattr(system_setting, field_to_update, new_value)
        system_setting.save()
        email_repetition = AdminSettings.objects.get(name=BACKGROUND_TASKS_NAME.PERIODIC_EMAILS_STARTS.value)
        if system_setting.name == BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value:
            # Change the background tasks's schedule
            try:
                Task.objects.get(task_name=BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value).delete()
                if system_setting.selected_value != BACKGROUND_TASK_DURATIONS.NEVER.get('value'):
                    create_notification_email_background_tasks(schedule=get_run_at(system_setting, email_repetition),
                                                               repeat=int(system_setting.selected_value))
            except Task.DoesNotExist:
                if system_setting.selected_value != BACKGROUND_TASK_DURATIONS.NEVER.get('value'):
                    create_notification_email_background_tasks(schedule=get_run_at(system_setting, email_repetition),
                                                               repeat=int(system_setting.selected_value))

        elif system_setting.name == BACKGROUND_TASKS_NAME.PERIODIC_EMAILS_ENABLED.value:
            # Switch whether or not to run the background task
            if not system_setting.bool_value:
                try:
                    Task.objects.filter(
                        task_name=BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value).delete()
                except Task.DoesNotExist:
                    print("Task does not exist and is disabled already....")
            else:
                background_task_system_settings = AdminSettings.objects.get(
                    name=BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value)
                if background_task_system_settings.selected_value != BACKGROUND_TASK_DURATIONS.NEVER.get('value'):
                    create_notification_email_background_tasks(
                        schedule=get_run_at(background_task_system_settings, email_repetition),
                        repeat=int(background_task_system_settings.selected_value))

        return Response(
            data=SuccessSerializer(dict(success=f'Successfully Updated the {setting_name}')).data,
            status=status.HTTP_200_OK,
            content_type="application/json"
        )


class AdminActivateUserController(APIView):
    permission_classes = [IsAuthenticated, RequireAdmin]

    def post(self, request, user_id):
        # First check if the user exists
        user_account = User.objects.filter(id=user_id)
        if not user_account.exists():
            return Response(
                data=ErrorSerializer(dict(error="This user does not exist.")).data,
                status=status.HTTP_404_NOT_FOUND,
                content_type="application/json"
            )

        # Now that we know the user exists, make sure that they are not already active
        user_account = user_account.first()
        if user_account.is_active:
            return Response(
                data=ErrorSerializer(dict(error="This user is already active.")).data,
                status=status.HTTP_400_BAD_REQUEST,
                content_type="application/json"
            )

        # Now that we have determined the user is not active, and they do exist, activate the user and return the response
        user_account.is_active = True
        user_account.save()
        success_message = f'Successfully activated the account for {user_account.get_full_name()}<{user_account.email}>'
        return Response(
            data=SuccessSerializer(dict(success=success_message)).data,
            status=status.HTTP_200_OK,
            content_type="application/json"
        )
