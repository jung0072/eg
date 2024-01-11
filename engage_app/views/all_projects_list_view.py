from django.views.generic import ListView

from engage_app.models import ResearchProject
from engage_app.projects_view_filters.view_filters.all_projects_view_filters import AllProjectsViewFilters
from engage_app.utils.constants import EngageViews


class AllProjectsListView(ListView):
    model = ResearchProject
    template_name = 'views/all_projects.html'
    view_filters = AllProjectsViewFilters()

    def get_context_object_name(self, object_list):
        return 'projects'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_view'] = EngageViews.ALL_PROJECTS.value
        context['page_title'] = 'All Projects'
        context['previous_view'] = '/'
        existing_filters = dict(self.request.GET)
        context['filters'] = self.view_filters.get_filters(existing_filters)
        return context

    def get_queryset(self):
        # default filter - ascending order of project title
        queryset = self.model.objects.filter(is_approved=True).order_by('title')

        for key in self.request.GET.keys():
            matched_filter = self.view_filters.get_filter(key)

            if matched_filter:
                query = self.request.GET.getlist(key)
                queryset = matched_filter.get_filtered_queryset(queryset=queryset, query=query)

        return queryset
