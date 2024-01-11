from django.db.models import QuerySet

from engage_app.projects_view_filters.base.project_filter import ProjectFilter
from engage_app.utils.constants import ListEnum


class SortByFilter(ProjectFilter):
    class SortType(ListEnum):
        PROJECT_TITLE_ASC = 'project-title-asc'
        PROJECT_TITLE_DESC = 'project-title-desc'
        REFERENCE_NAME_ASC = 'reference-name-asc'
        REFERENCE_NAME_DESC = 'reference-name-desc'
        END_DATE_ASC = 'end-date-asc'
        END_DATE_DESC = 'end-date-desc'

    SORT_CHOICES = {
        SortType.PROJECT_TITLE_ASC: 'Project title - Ascending',
        SortType.PROJECT_TITLE_DESC: 'Project title - Descending',
        SortType.REFERENCE_NAME_ASC: 'Reference name - Ascending',
        SortType.REFERENCE_NAME_DESC: 'Reference name - Descending',
        SortType.END_DATE_ASC: 'End date - Ascending',
        SortType.END_DATE_DESC: 'End date - Descending',
    }

    def __init__(self):
        super().__init__(key='sort-by', name='Sort by')

    def register_choices(self):
        for key, name in self.SORT_CHOICES.items():
            self.choices.append({'key': key.value, 'name': name})

    def get_filtered_queryset(self, queryset: QuerySet, query: list):

        if self.SortType.PROJECT_TITLE_ASC.value in query:
            return queryset.order_by('title')

        if self.SortType.PROJECT_TITLE_DESC.value in query:
            return queryset.order_by('-title')

        if self.SortType.REFERENCE_NAME_ASC.value in query:
            return queryset.order_by('reference_name')

        if self.SortType.REFERENCE_NAME_DESC.value in query:
            return queryset.order_by('-reference_name')

        if self.SortType.END_DATE_ASC.value in query:
            return queryset.order_by('end_date')

        if self.SortType.END_DATE_DESC.value in query:
            return queryset.order_by('-end_date')

        return queryset
