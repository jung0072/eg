from ajax_select import register, LookupChannel
from django.core.exceptions import PermissionDenied

from auth_app.models import ResearchInterest


@register('research_interests')
class ResearchInterestsLookup(LookupChannel):
    model = ResearchInterest
    search_field = 'title'

    def format_item_display(self, obj):
        return u"<span class='tag'>%s</span>" % obj.title

    def check_auth(self, request):
        """To override the default ajax-select permissions of just staff members we need to make sure we open this up
        to all authenticated users"""
        if not request.user.is_authenticated:
            raise PermissionDenied
