import itertools

from engage_app.projects_view_filters.base.project_filter import ProjectFilter


class ProjectsViewFilters:
    """
    Base class to manage filters available for a view that displays a projects list.

    Usage - extend the class and override the register_filters to register filters
    supported by a projects list view. Refer AllProjectsViewFilters.

    filters - Instances of ProjectFilter for all the filters of the view
    """

    def __init__(self):
        self.filters = {}
        self.register_filters()

    def get_filters(self, existing_queries: dict) -> dict:
        return self.build_filters_map(existing_queries)

    def add_filter(self, filter_to_set: ProjectFilter):
        self.filters.update({filter_to_set.get_key(): filter_to_set})

    def get_filter(self, key: str) -> ProjectFilter:
        return self.filters.get(key)

    def build_filters_map(self, existing_queries: dict) -> dict:
        filters_list = dict()
        existing_values = list(itertools.chain(*existing_queries.values()))

        for key, filter_item in self.filters.items():
            choices = filter_item.get_choices(existing_values=existing_values)
            filters_list.update({key: choices})

        return filters_list

    def register_filters(self):
        """
        Registers filters by adding ProjectFilter instances to the filters
        property of the class. The filters must be added using the add_filter
        method within this method.
        """
        pass
