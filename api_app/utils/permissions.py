from django.contrib.auth.models import User
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from rest_framework import permissions
from rest_framework.exceptions import NotFound
from rest_framework.exceptions import PermissionDenied

from api_app.utils.request_addons import attach_project
from auth_app.utils.common import *

from engage_app.models import ResearchProjectTaskAssignedUser, ResearchProjectParticipant, ResearchProject
from auth_app.models import UserProfile


def attach_or_not_found(request, view):
    # Attach the project object to the request
    if 'project_id' not in view.kwargs:
        raise Exception(
            "Cannot attach project, view is missing project id. Please make sure you use 'project_id' as the name of your named arg.")
    attach_project(request, view.kwargs['project_id'])


def attach_research_project_task(request, view):
    if 'task_id' not in view.kwargs:
        raise Exception("Cannot attach task, view is missing task_id.")

    if not hasattr(request, 'project'):
        raise Exception("You need to attach a task with a project")

    potential_task_assigned_user = ResearchProjectTaskAssignedUser.objects.filter(
        assigned_user=request.user, research_project_task_id=view.kwargs['task_id']
    )
    # if the task assignee exists then they can modify this task
    if potential_task_assigned_user.exists():
        task_assigned_user = potential_task_assigned_user.first()
        setattr(request, 'research_project_task_assigned_user', task_assigned_user)

        # Check if this is the task owner, or admin or a project lead
        project_pi_id_list = list(ResearchProjectParticipant.objects.filter(
            study_id=task_assigned_user.research_project_task.research_project_id,
            is_principal_investigator=True
        ).values_list('user_id', flat=True))
        task_editing_permission_check_list = [
            task_assigned_user.research_project_task.task_creator_id == request.user.id,
            request.user.id in project_pi_id_list,
            request.user.is_superuser and request.user.is_staff
        ]
        if task_assigned_user.research_project_task.task_creator_id == request.user.id or any(
                task_editing_permission_check_list):
            setattr(request, "can_edit_task", True)
        else:
            setattr(request, "can_edit_task", False)
    else:
        raise PermissionDenied("This assigned user for the task was not found")


class RequireProjectMembership(permissions.BasePermission):
    """Rest Framework permission class to require the user to be a member of the project"""

    def has_permission(self, request, view):
        attach_or_not_found(request, view)
        return request.project_membership is not None and request.project_membership.is_active


class RequiredRolesForProject(permissions.BasePermission):
    """Rest Framework permission class to allow only the roles specified by the controller"""

    def __init__(self, allowed_roles):
        super().__init__()
        self.allowed_roles = allowed_roles

    def has_permission(self, request, view):
        attach_or_not_found(request, view)

        if request.project_membership is not None:
            # Check if any of the allowed roles are present in request.project_membership
            for allowed_role in self.allowed_roles:
                # Use getattr to dynamically access the role attribute in request.project_membership
                # If the attribute is present and evaluates to True, permission is granted
                if getattr(request.project_membership, allowed_role, None):
                    return True

        # Permission denied if no allowed role is found or request.project_membership is None
        return False


class RequireProjectTaskAssigned(permissions.BasePermission):
    """Rest Framework permission class to require the user is assigned to the task that they are modifying."""

    def has_permission(self, request, view):
        attach_or_not_found(request, view)
        attach_research_project_task(request, view)
        return hasattr(request, 'research_project_task_assigned_user')


class RequireProjectTaskOwner(permissions.BasePermission):
    """Rest Framework permission class to require the user is the owner to the task that they are modifying. Or they are
    a project creator, or project lead or the admin"""

    def has_permission(self, request, view):
        attach_or_not_found(request, view)
        attach_research_project_task(request, view)
        return hasattr(request, 'can_edit_task')


class RequireAdmin(permissions.BasePermission):
    """Rest Framework permission class to require the user to be an admin"""

    def has_permission(self, request, view):
        return request.user.is_superuser


class RequirePasswordResetToken(permissions.BasePermission):
    """Rest Framework permission class to check if the password reset token is valid or not"""

    def has_permission(self, request, view):
        # First get the token and uidb64 string from the request data based on the request type
        if request.method == 'POST':
            token = request.data.get('token')
            uidb64 = request.data.get('encoded_user_id')
        elif request.method == 'GET':
            token = request.GET.get('token')
            uidb64 = request.GET.get('encoded_user_id')
        else:
            raise PermissionDenied("This is an invalid request.")

        # Now using the token and uidb64 string decode the user and return the permissions check
        if token and uidb64:
            user = decode_user(uidb64)
            if user is not None and default_token_generator.check_token(user, token):
                return True
        raise PermissionDenied(
            "Invalid or missing password reset token, please send another request to reset your password."
        )


class IsProjectNotArchived(permissions.BasePermission):
    """
    Custom permission class to check if a project is not archived before allowing certain actions.

    This permission class allows read permissions (GET, HEAD, or OPTIONS) for any request.
    For other methods (POST, PATCH, DELETE), it checks if the project is archived and denies permission if it is.

    Attributes:
        None

    Methods:
        has_permission(self, request, view): Checks if the project is not archived before allowing the specified action.
    """

    def has_permission(self, request, view):
        # Check if the project is archived
        project_id = view.kwargs.get('project_id')
        research_project = get_object_or_404(ResearchProject, id=project_id)

        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Restrict other methods (POST, PATCH, DELETE) if the project is archived
        if research_project.is_archived:
            raise PermissionDenied("Cannot perform this action on an archived project.")

        return True


class CanViewAnonProfile(permissions.BasePermission):

    def has_permission(self, request, view):
        # "requesting_user_id" refers to the user who initiates or sends a request.
        # "requested_user_id" refers to the user who is being requested or the target of the request.
        requesting_user_id = request.user.id
        requested_user_id = view.kwargs.get('user_id')

        # if user looking at this own profile
        if requesting_user_id == requested_user_id:
            return True

        requested_user_profile=UserProfile.objects.get(user_id=requested_user_id)

        # if the profile is not anonymous show profile
        if not requested_user_profile.is_anonymous:
            return True

        # filter out the projects requested user is part of (active or not).
        requested_user_projects_participation = ResearchProjectParticipant.objects.filter(
            user_id=requested_user_id
        ).values('study_id', 'is_anonymous', 'is_active')

        # filter out the common projects for the requesting user
        requesting_user_project_participation = ResearchProjectParticipant.objects.filter(
            is_active=True,
            user_id=requesting_user_id,
            study_id__in=[project['study_id'] for project in requested_user_projects_participation]
        ).values('study_id', 'is_project_lead')

        if not requesting_user_project_participation:
            raise PermissionDenied("You are not allowed to view this user profile.")

        # now that we have common project of requesting user we can filter down the requested user project as well
        common_requested_user_projects=requested_user_projects_participation.filter(
            study_id__in=list(requesting_user_project_participation.values_list('study_id'))
        )

        # if requested user has false value for anonymous
        has_false_anonymous = any(item['is_anonymous'] == False for item in common_requested_user_projects)
        # if requesting user is lead in any
        is_requesting_lead_in_any = any(item['is_project_lead'] == True for item in requesting_user_project_participation)

        # if the requested user has False in the common projects that means they have joined the project and team member
        # can view their profile if not then we check if requesting user is lead in any of the project
        # if is_lead then we show them the profile else permission denied
        if has_false_anonymous: 
            return True
        if not has_false_anonymous and is_requesting_lead_in_any:
            return True
        else:
            raise PermissionDenied("You are not allowed to view this user profile.")
