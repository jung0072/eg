from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """
    Custom permission class that only allows admin users to access the API.
    """

    def has_permission(self, request, view):
        """
        Return True if the user is admin, False otherwise.
        """
        return request.user.is_superuser
