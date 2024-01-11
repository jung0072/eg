from django.db.models import QuerySet

from engage_app.models import ResearchProject
from engage_app.projects_search.projects_search import ProjectsSearch
from engage_app.projects_view_filters.base.project_filter import ProjectFilter


class SearchFilter(ProjectFilter):
    def __init__(self):
        self.search_query = ''
        super().__init__(key='search', name='Search')

    def register_choices(self):
        self.choices.append({'search_query': self.search_query})

    def get_choices(self, existing_values: dict) -> list:
        # when no query strings are present, clear the
        # in-memory search query
        if not existing_values:
            self.search_query = ''

        self.choices[0] = {'search_query': self.search_query}
        return self.choices

    def get_filtered_queryset(self, queryset: QuerySet, query: list) -> QuerySet[ResearchProject]:
        self.search_query = query[0]
        projects_search = ProjectsSearch(search_query=self.search_query)
        return projects_search.search()
