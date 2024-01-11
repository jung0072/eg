from django.db.models import QuerySet

from engage_app.models import ResearchProject


class ProjectFilter:
    """
    Base class for a filter used to filter a queryset of projects.
    Filters have choices that represent the different ways in which the filter can
    be applied.

    Usage - extend the class and override get_filtered_queryset and register_choices.
    Refer ProjectCreatorFilter or SortByFilter.

    key - uniquely identifies a filter and is added to the URL as a query string
    with a choice option as the value to apply the filter

    name - name of the filter

    choices - ways in which the filter can be applied
    """

    def __init__(self, key: str, name: str):
        self.key = key
        self.name = name
        self.choices = []
        self.register_choices()

    def get_key(self) -> str:
        return self.key

    def get_name(self) -> str:
        return self.name

    def get_choices(self, existing_values: dict) -> list:
        """
        The default implementation acts as an accessor to the choices of the filter.
        Based on the existing values provided, the choices are serialized with a
        selected boolean property saying if the choice is present in the query
        string or not. The method can be overridden providing custom
        serialization of choices for the filter.
        """
        for choice in self.choices:
            is_selected = str(choice.get('key')) in existing_values
            choice.update({'selected': is_selected})

        return self.choices

    def get_filtered_queryset(self, queryset: QuerySet, query: list) -> QuerySet[ResearchProject]:
        """
        The method applies the current filter to the provided query set and returns it.
        Here query will be the user selected values from the filter choices and based on
        that the query should be filtered.
        """
        return queryset

    def register_choices(self):
        """
        Override the method if the filter has options or choices which will be used
        to apply the filter. Make sure to append the choices to the choices property.
        """
        pass
