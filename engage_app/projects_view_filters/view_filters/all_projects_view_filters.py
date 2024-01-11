from engage_app.projects_view_filters.base.view_filters import ProjectsViewFilters
from engage_app.projects_view_filters.filters.project_creator_filter import ProjectCreatorFilter
from engage_app.projects_view_filters.filters.search_filter import SearchFilter
from engage_app.projects_view_filters.filters.sort_by_filter import SortByFilter
from engage_app.projects_view_filters.filters.user_roles_filter import UserRolesFilter


class AllProjectsViewFilters(ProjectsViewFilters):

    def register_filters(self):
        # filters are registered in the order they should be applied
        self.add_filter(SearchFilter())
        self.add_filter(SortByFilter())
        # TODO: Look into programming error caused by ProjectCreatorFilter when initialized with empty database
        # self.add_filter(ProjectCreatorFilter())
        self.add_filter(UserRolesFilter())
