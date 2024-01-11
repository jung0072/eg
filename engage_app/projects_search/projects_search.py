from django.contrib.postgres.search import SearchQuery, SearchVector
from django.db.models import QuerySet

from engage_app.models import ResearchProject


class ProjectsSearch:
    def __init__(self, search_query: str = None):
        self.search_query = search_query.strip().lower() if search_query else search_query
        self.search_fields = ['id', 'title', 'reference_name']

    def search(self) -> QuerySet[ResearchProject]:
        if not self.search_query:
            return ResearchProject.objects.all()

        query = SearchQuery(self.search_query)
        vector_fields = SearchVector(*self.search_fields)

        return ResearchProject.objects.annotate(
            search=vector_fields
        ).filter(search=query)
