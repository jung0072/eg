import secrets
import string
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404, reverse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken
from django.utils import timezone

from api_app.serializers import ErrorSerializer, SuccessSerializer
from api_app.utils import remove_leading_trailing_whitespace
from api_app.utils.permissions import RequiredRolesForProject, IsProjectNotArchived
from auth_app.models import UserProfile
from communication_app.models import Notification, DiscussionBoard, Message
from communication_app.utils import NotificationTypes
from config import settings
from email_app.utils import EngageEmail, EmailTemplateConstants
from engage_app.forms import AddNewTeamMemberToProjectForm
from engage_app.models import ResearchProject, ResearchProjectParticipant, ResearchProjectTask, \
    ResearchProjectTaskAssignedUser, ResearchProjectTaskFile
from engage_app.utils import UserRoles, ResearchTeamPermissionLevels
from engage_app.utils.common import generate_temp_password
from base_app.utils.common import create_new_user


class RequestToJoinResearchProjectController(APIView):
    permission_classes = [IsAuthenticated, IsProjectNotArchived]

    def post(self, request, project_id):
        """Validate if the current user is a patient or an approved researcher then add them to the project. These users will
            be unapproved (inactive) until they get accepted by a principal investigator."""
        # First validate if the requested project exists
        research_study = get_object_or_404(ResearchProject, id=project_id)
        # Retrieve all the current team members of the project, to make sure the requesting user is not on the team
        project_participants = ResearchProjectParticipant.objects.filter(study_id=project_id)
        if request.user.id in project_participants.values_list('user_id', flat=True):
            return Response(
                data=ErrorSerializer(dict(error="Could not join project, you are already apart of the project")).data,
                status=status.HTTP_401_UNAUTHORIZED, content_type="application/json"
            )

        # Using the requesting users role, check if they are an approved researcher or a patient partner
        user_profile = get_object_or_404(UserProfile, user=request.user)
        if user_profile.role in UserRoles.get_patient_partner_types():
            requested_patient_partner_role = True
        elif user_profile.is_approved_researcher:
            requested_patient_partner_role = False
        else:
            return Response(
                data=ErrorSerializer(dict(error="This is not a valid request")).data,
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Now that the user is validated, create the project participant record for the current user
        new_project_participant = ResearchProjectParticipant.add_user_to_team(
            user_id=request.user.id, study_id=project_id, is_patient_partner=requested_patient_partner_role,
            is_active=False, is_approved=False, is_archived=research_study.is_archived
        )

        if new_project_participant:
            # Send project owner a notification that
            Notification.objects.create(
                receiver=research_study.creator,
                type=NotificationTypes.PROJECT.value,
                source_id=project_id,
                content=f"{request.user.get_full_name()} has requested to join the project as a {new_project_participant.get_current_role()}",
                link=reverse('auth_app:react_project_details', args=[project_id])
            )
            serialized_response = SuccessSerializer(dict(
                success=f"You've successfully requested to join {research_study.title} as a {new_project_participant.get_current_role()}",
            ))
            response_status = status.HTTP_200_OK
        else:
            serialized_response = ErrorSerializer(dict(
                error=f"Unable to make a request to join {research_study.title}",
            ))
            response_status = status.HTTP_400_BAD_REQUEST

        return Response(
            data=serialized_response.data,
            status=response_status, content_type="application/json"
        )


class AddUserToResearchProjectController(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), RequiredRolesForProject(['is_project_lead', 'is_principal_investigator']), IsProjectNotArchived()]

    def post(self, request, project_id):
        """After checking if the current user has access to add a team member, add the new user to the team"""
        # Get the current user profile and the research project, if the lead researcher or creator is making ths request
        # add the requested user to the project or return the appropriate response
        current_user_profile = get_object_or_404(UserProfile, user_id=request.user.id)
        research_project = get_object_or_404(ResearchProject, id=project_id)
        permissions = get_object_or_404(
            ResearchProjectParticipant, user_id=current_user_profile.user.id, study_id=research_project.id
        )

        if permissions.is_lead_researcher_or_creator:
            post_data = request.data.copy()
            # If we only have 1 user being added then we have to set them as a list to iterate over them
            if "users" not in post_data:
                post_data = {"users": [post_data]}
            error_response_data = None


            # get all the profiles of the user and check if they are trying 
            # to add a user who has opted out from project invitation
            user_ids = [user_data.get('user_id', None) for user_data in post_data["users"]]
            user_profiles=UserProfile.objects.filter(user_id__in=user_ids, opt_out_project_invitations=True)
            if user_profiles:
                return Response(
                    ErrorSerializer(dict(
                        form_errors=["You're attempting to add a user who has chosen not to receive invitations to projects."]
                    )).data,
                    content_type="application/json",
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Iterate over each user and build a response object when necessary
            for user_data in post_data["users"]:
                new_user_id = user_data.get('user_id', None)
                if new_user_id:
                    if new_user_id < 0:
                        # If the user id is negative, that means we are creating a new user
                        # First create an account for the user after checking if the email is already used to register
                        if User.objects.filter(email=user_data['email'].lower()).exists():
                            error_response_data = dict(
                                data=ErrorSerializer(
                                    dict(form_errors=["This user already has a pending invitation to the system"])
                                ).data,
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR
                            )
                            break
                        AddUserToResearchProjectController.create_user_and_invite_to_project(
                            user_info=user_data, project=research_project
                        )
                        continue
                    else:
                        # Check if the team member already exists, if they do send an error
                        new_team_member_permissions = ResearchProjectParticipant.objects.filter(
                            study_id=project_id, user_id=new_user_id
                        )
                        if new_team_member_permissions.exists():
                            error_response_data = dict(
                                data=ErrorSerializer(
                                    dict(form_errors=["This user is already apart of the team"])
                                ).data,
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR
                            )
                            break

                # if the user does not exist, add them to the project and send the appropriate response
                new_team_member_form = AddNewTeamMemberToProjectForm(user_data, study_id=project_id, is_archived=research_project.is_archived)
                if not new_team_member_form.is_valid():
                    error_response_data = dict(
                        data=ErrorSerializer(
                            dict(error="Invalid request", form_errors=dict(new_team_member_form.errors.items()))
                        ).data,
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                    break
                new_team_member_form.save(study_id=project_id)

            if error_response_data:
                return Response(content_type="application/json", **error_response_data)
            return Response(
                SuccessSerializer(dict(success="You have successfully added the users(s) to the team")).data,
                status=status.HTTP_200_OK, content_type="application/json"
            )

        return Response(
            ErrorSerializer(dict(form_errors=["This is not a valid request"])).data, content_type="application/json",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    @staticmethod
    def create_user_and_invite_to_project(user_info: dict, project: ResearchProject):
        # First normalize the user's email and generate a temp password to create the account

        new_user_result = create_new_user(user_info)

        new_user=new_user_result['user']
        new_user_profile=new_user_result['new_user_profile']
        temp_password=new_user_result['temp_password']

        # With the new account send them the default notification
        Notification.objects.create(
            receiver_id=new_user.id,
            content=f"Welcome to Engage the Patient Engage Research Platform where patients and families of patients can collaborate with researchers to engage in research studies. Please click on User Menu in the Top Right of the application and go to : Profile > Edit Profile to start filling out your information",
            source_id=User.objects.filter(is_superuser=True).first().id,
            link=f"{reverse('auth_app:edit_user_profile')}",
            type=NotificationTypes.ACCOUNT.value
        )
        # Now with the newly created account add the user to the project
        ResearchProjectParticipant.add_user_to_team(
            is_patient_partner=new_user_profile.is_patient_partner, study_id=project.id, user_id=new_user.id,
            is_active=False, is_approved=True, new_user=True, is_archived=project.is_archived
        )

        # Send a notification to this user telling them they have been added to the project
        Notification.objects.create(
            receiver_id=new_user.id,
            source_id=project.id,
            content=f'You have been invited to join a research project. Access the project page and click Join '
                    f'Project to accept the invite',
            link=reverse('auth_app:react_project_details', args=[project.id]),
            type=NotificationTypes.PROJECT.value
        )
        # After adding the user to the project send the new user the email to activate their account and join engage.
        access = AccessToken().for_user(new_user)
        access.set_exp(lifetime=timedelta(hours=10))
        access['email'] = new_user.email

        email_params = {
            'email': new_user.email,
            'user': new_user,
            'link': f"{settings.SERVER_NAME}activate_user/{access}/",
            'project': project,
            'temp_password': temp_password
        }

        email = EngageEmail(
            subject=f'Engage | {EmailTemplateConstants.INVITED_TO_ENGAGE}',
            template_name=EmailTemplateConstants.INVITED_TO_ENGAGE_TEMPLATE,
            template_params=email_params
        )
        email.set_recipients(to=email_params["user"].email, cc=email_params['user'].email)
        email.send()


class JoinResearchStudyController(APIView):
    permission_classes = [IsAuthenticated, IsProjectNotArchived]

    def post(self, request, project_id):
        """Validate if the current user has been requested to join a project and then update their permission to activate"""
        # First validate if the requested project exists
        research_study = get_object_or_404(ResearchProject, id=project_id)

        # Now using the users permissions record, check if they have been approved to the project but not activated
        permissions = get_object_or_404(
            ResearchProjectParticipant, study_id=project_id, user_id=request.user.id
        )

        # if the user is not valid for this request, abort early otherwise activate their permissions and save to the db
        if permissions.is_active or not permissions.is_approved:
            return Response(
                data=ErrorSerializer(
                    dict(form_errors=[f"Could not join the project {research_study.title} at this time"])
                ).data,
                status=status.HTTP_400_BAD_REQUEST, content_type="application/json"
            )

        # Save the updated permissions to the database
        permissions.is_active = True

        # set anonymous to false when they join the project that way we can show their profile to team members now
        permissions.is_anonymous = False

        permissions.save()
        success_serializer = SuccessSerializer(
            dict(success=f"You have successfully joined the Research Study {research_study.title}")
        ).data
        success_serializer['is_active_on_project'] = True
        # Send a notification to the project creator saying this user has joined the project
        Notification.objects.create(
            receiver_id=research_study.creator_id,
            source_id=research_study.id,
            content=f'The user {permissions.user.get_full_name()} has accepted their invitation to the '
                    f'project {research_study.title}. You can now update their permissions as needed.',
            link=reverse('auth_app:react_project_details', args=[project_id]),
            type=NotificationTypes.PROJECT.value
        )
        return Response(
            data=success_serializer,
            status=200
        )


class ActivateNewTeamMemberController(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), RequiredRolesForProject(['is_project_lead', 'is_principal_investigator'])]

    def get(self, request, project_id, user_id):
        """Using the user id of the new team member and the research project id, activate the user in the project"""
        # First validate if the requested project exists and if the current user has the appropriate rights to modify
        research_study = get_object_or_404(ResearchProject, id=project_id)
        current_user_permissions = get_object_or_404(
            ResearchProjectParticipant, user_id=request.user.id, study_id=research_study.id
        )
        new_team_member_permissions = get_object_or_404(
            ResearchProjectParticipant, user_id=user_id, study_id=research_study.id
        )
        if not current_user_permissions.is_lead_researcher_or_creator or new_team_member_permissions.is_active:
            return Response(
                ErrorSerializer(
                    dict(
                        form_errors=[{'user': f"This user is already activated and has access to the project"}],
                        error="Already apart of the project!"
                    )
                ).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR, content_type="application/json"
            )

        # After validating the request, update the user and save to the database
        new_team_member_permissions.is_active = True
        # set anonymous to false when they join the project that way we can show their profile to team members now
        new_team_member_permissions.is_anonymous = False
        new_team_member_permissions.save()

        # Give the added user a notification that they've been added
        Notification.objects.create(
            receiver=new_team_member_permissions.user,
            type=NotificationTypes.PROJECT.value,
            source_id=project_id,
            content=f"You've been approved for this project!",
            link=reverse('auth_app:react_project_details', args=[project_id]),
        )
        serialized_data = SuccessSerializer(
            dict(
                success=f"You have successfully added the user {new_team_member_permissions.user.get_full_name()} to the project {research_study.title}"
            )
        )
        # Return a response for the toast
        return Response(data=serialized_data.data, content_type="application/json", status=status.HTTP_200_OK)


class ChangeTeamMemberPermissions(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), RequiredRolesForProject(['is_project_lead', 'is_principal_investigator']), IsProjectNotArchived()]

    def post(self, request, project_id, user_id):
        # First check if the current user exists and if they are active
        request_user_permissions = get_object_or_404(
            ResearchProjectParticipant, user_id=user_id, study_id=project_id
        )
        old_user_role = ResearchTeamPermissionLevels[request_user_permissions.get_permissions_level()].value
        if not request_user_permissions.is_active:
            return Response(
                ErrorSerializer(dict(error="This user is not active on this research project")).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR, content_type="application/json"
            )
        new_permission_level = request.data.get('permission_level')
        request_user_permissions.set_permission_level(new_permission_level)

        # Send the user with updated permissions a notification telling them about their change
        current_user_role = ResearchTeamPermissionLevels[request_user_permissions.get_permissions_level()].value
        Notification.objects.create(
            receiver_id=user_id,
            type=NotificationTypes.PROJECT.value,
            source_id=project_id,
            content=f"Your role on the project {request.project.reference_name} has been changed from {old_user_role} to {current_user_role}",
            link=reverse('auth_app:react_project_details', args=[project_id]),
        )

        # Serialize the response and send it to the user that updated the permissions
        serialized_data = SuccessSerializer(
            dict(
                success=f"You have updated the permissions for {request_user_permissions.user.get_full_name()} to {ResearchTeamPermissionLevels[new_permission_level].value}"
            )
        )
        return Response(data=serialized_data.data, content_type="application/json", status=status.HTTP_200_OK)


class DeleteMemberController(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), RequiredRolesForProject(['is_project_lead', 'is_principal_investigator']), IsProjectNotArchived()]

    def post(self, request, project_id, user_id):
        """Delete a member from a research project"""
        try:
            with transaction.atomic():
                ResearchProjectParticipant.objects.filter(user_id=user_id, study_id=project_id).delete()
                task_ids = ResearchProjectTask.objects.filter(research_project_id=project_id).values_list('id',
                                                                                                          flat=True)
                ResearchProjectTaskAssignedUser.objects.filter(assigned_user_id=user_id,
                                                               research_project_task_id__in=task_ids).delete()
                discussion_board_ids = DiscussionBoard.objects.filter(
                    Q(research_project_id=project_id) | Q(parent_task_id__in=task_ids)).values_list('id', flat=True)
                Message.objects.filter(discussion_board_id__in=discussion_board_ids, sender_id=user_id).delete()
                ResearchProjectTaskFile.objects.filter(uploader_id=user_id, parent_task_id__in=task_ids).delete()
        except Exception:
            return Response(
                data=ErrorSerializer(dict(
                    error="Could not delete the selected member from the project.",
                    form_errors=dict(could_not_delete=['Failed to delete the member and related objects.'])
                )).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )
        return Response(
            data=SuccessSerializer(dict(success='You have successfully deleted the member')).data,
            status=status.HTTP_200_OK,
            content_type="application/json"
        )


class DeactivateMemberController(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), RequiredRolesForProject(['is_project_lead', 'is_principal_investigator']), IsProjectNotArchived()]

    def post(self, request, project_id, user_id):
        """Deactivate a member from a research project"""
        anonymous_user_id = get_anonymous_user(project_id).id

        deactivate_member(project_id, user_id, anonymous_user_id)

        return Response(
            data=SuccessSerializer(dict(success='You have successfully deactivated the member')).data,
            status=status.HTTP_200_OK,
            content_type="application/json"
        )


class DeactivateSelfController(APIView):
    permission_classes = [IsAuthenticated, IsProjectNotArchived]

    def post(self, request, project_id):
        """Deactivate a member from a research project"""
        user_id = request.user.id
        anonymous_user_id = get_anonymous_user(project_id).id

        deactivate_member(project_id, user_id, anonymous_user_id)

        return Response(
            data=SuccessSerializer(dict(success='You have successfully deactivated the member')).data,
            status=status.HTTP_200_OK,
            content_type="application/json"
        )


def deactivate_member(project_id, user_id, anonymous_user_id):
    task_ids = ResearchProjectTask.objects.filter(research_project_id=project_id).values_list('id', flat=True)
    discussion_board_ids = DiscussionBoard.objects.filter(
        Q(research_project_id=project_id) | Q(parent_task_id__in=task_ids)).values_list('id', flat=True)

    ResearchProjectParticipant.objects.filter(user_id=user_id, study_id=project_id).update(user_id=anonymous_user_id)
    ResearchProjectTaskAssignedUser.objects.filter(assigned_user_id=user_id,
                                                   research_project_task_id__in=task_ids).update(
        assigned_user_id=anonymous_user_id)
    ResearchProjectTaskFile.objects.filter(uploader_id=user_id, parent_task_id__in=task_ids).update(
        uploader_id=anonymous_user_id)
    Message.objects.filter(discussion_board_id__in=discussion_board_ids, sender_id=user_id).update(
        sender_id=anonymous_user_id)


def get_anonymous_user(project_id=None):
    """Get an anonymous user to replace a current user of the project. Will create an anonymous user if none are found"""
    # check for anonymous users on the project, first get all users with the email @scripts.engage.ca
    # then get all the reviewers on the project and filter out any not on the project
    # regex will match any numeric or alphabetic character,
    # along with a few others and the domain @scripts.engage.ca
    anonymous_users = User.objects.filter(
        email__regex=r'^[A-Za-z0-9._%+-]+@scripts\.engage\.ca$',
        last_name="ENGAGE"  # extra check to ensure that we are getting the users we want
    ).order_by('date_joined')

    # if we do not have any anonymous users, create a new user with the id 1
    # if we do have anonymous users, create a list of just the id's to be used to query the DB
    if not anonymous_users:
        return create_anonymous_user("ANONYMOUS_1")

    anonymous_user_ids = anonymous_users.values_list("id", flat=True)

    # if we do have query all the users on the project, if we have remaining users, return the first entry
    # otherwise create and return a user
    anonymous_users_on_project = ResearchProjectParticipant.objects.filter(
        user_id__in=anonymous_user_ids,
        study_id=project_id
    )

    # create a new list to hold the filtered users
    anonymous_users_not_on_project = User.objects.filter(
        id__in=anonymous_user_ids
    ).exclude(id__in=anonymous_users_on_project.values_list("user_id"))

    # return the first user if we have an anonymous user not on a project
    if anonymous_users_not_on_project.exists():
        return anonymous_users_not_on_project.first()

    # if there is no anonymous users then get the id of the last anonymous user (from the username, after hyphen)
    # add 1 and create a new user with it
    last_anonymous_id = int(anonymous_users.last().username.split("_")[-1])

    return create_anonymous_user(f"ANONYMOUS_{last_anonymous_id + 1}")


def create_anonymous_user(username=""):
    """Create a user under the engage script domain with the specified username"""""
    alphabet = string.ascii_letters + string.digits
    password = ''.join(secrets.choice(alphabet) for i in range(20))  # for a 20-character password
    reviewer = User.objects.create_user(
        username=username, email=f'{username}@scripts.engage.ca', password=password, last_name="ENGAGE",
        is_active=True, first_name=username
    )
    reviewer.save()
    UserProfile.objects.create(user_id=reviewer.id)
    return reviewer


class PromptUserForProjectInvitationController(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), RequiredRolesForProject(['is_project_lead', 'is_principal_investigator']), IsProjectNotArchived()]

    def post(self, request, project_id):
        # First determine which user is getting prompted and if they exist and if the project exists
        user_id_to_prompt = request.data.get('user_id', None)
        user_to_prompt = User.objects.get(id=user_id_to_prompt)
        research_study = ResearchProject.objects.get(id=project_id)

        # Now that we have determined this user exists on the system, validate if they are on the project
        user_to_prompt_permissions = ResearchProjectParticipant.objects.filter(study_id=project_id, user=user_to_prompt)
        if user_to_prompt_permissions.exists():
            # Now check if the user is on the project or not (if they even need to be prompted)
            user_to_prompt_permissions = user_to_prompt_permissions.first()
            if not user_to_prompt_permissions.is_active_on_project():
                # Now that we have determined this is a valid user to prompt we can send off the email
                email_params = {
                    'email': user_to_prompt.email,
                    'user': user_to_prompt,
                    'inviter': request.user,
                    'link': f"{settings.SERVER_NAME}app/research_study/{project_id}/",
                    'project': research_study,
                    'stage': user_to_prompt_permissions.stage
                }

                email = EngageEmail(
                    subject=f'Engage | You were invited by {request.user.get_full_name()} to join the Project: {research_study.reference_name}',
                    template_name=EmailTemplateConstants.REQUEST_TO_JOIN_PROJECT_TEMPLATE,
                    template_params=email_params
                )
                email.set_recipients(to=email_params["user"].email, cc=email_params['user'].email)
                email.send()

                # Before returning the response to the user save the prompt date to the participation model
                user_to_prompt_permissions.prompt_date = timezone.now()
                user_to_prompt_permissions.save()
                return Response(
                    data=SuccessSerializer(
                        dict(success='You have successfully prompted the team member to join the project')
                    ).data,
                    status=status.HTTP_200_OK,
                    content_type="application/json"
                )
            # If the user is active return a response saying as such
            return Response(
                data=ErrorSerializer(dict(
                    error=f'This user is currently on the project {research_study.title}, there is no need to prompt'
                )).data,
                status=status.HTTP_400_BAD_REQUEST,
                content_type="application/json"
            )

        return Response(
            data=ErrorSerializer(dict(error=f'This user is not currently on the project {research_study.title}')).data,
            status=status.HTTP_400_BAD_REQUEST,
            content_type="application/json"
        )
