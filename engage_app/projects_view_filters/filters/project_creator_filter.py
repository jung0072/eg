from django.contrib.auth.models import User
from django.db.models import QuerySet

from engage_app.projects_view_filters.base.project_filter import ProjectFilter


class ProjectCreatorFilter(ProjectFilter):

    def __init__(self):
        super().__init__(key='project-creator', name='Project creator')

    def register_choices(self):
        for creator in User.objects.filter(is_active=True):
            self.choices.append({'key': creator.id, 'name': creator.get_full_name()})

    def get_filtered_queryset(self, queryset: QuerySet, query: list) -> QuerySet:
        return queryset.filter(creator_id__in=query)
