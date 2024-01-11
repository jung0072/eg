from django.db.models import QuerySet, Q

from engage_app.models import ResearchProject
from engage_app.projects_view_filters.base.project_filter import ProjectFilter
from engage_app.utils.constants import UserRoles


class UserRolesFilter(ProjectFilter):
    USER_ROLE_CHOICES = {
        'patient': UserRoles.PATIENT,
        'family-of-patient': UserRoles.FAMILY_OF_PATIENT,
    }

    def __init__(self):
        super().__init__(key='user-roles', name='User Roles')

    def register_choices(self):
        for key, role in self.USER_ROLE_CHOICES.items():
            self.choices.append({'key': key, 'name': role.value})

    def get_filtered_queryset(self, queryset: QuerySet, query: list) -> QuerySet[ResearchProject]:
        query_keys = []

        for role_key in query:
            key_enum = self.USER_ROLE_CHOICES.get(role_key)
            if key_enum:
                query_keys.append(key_enum.name)

        keys_filters = Q(roles_needed__contains=[query_keys[0]])
        for key in query_keys[1:]:
            keys_filters |= Q(roles_needed__contains=[key])

        return queryset.filter(keys_filters)
