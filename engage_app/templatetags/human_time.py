import datetime

from django import template
from django.contrib.humanize.templatetags.humanize import naturaltime
from datetime import datetime
from django.utils import timezone

register = template.Library()


@register.filter
def human_time(dt: datetime) -> str:
    """
    Returns a relative time for dates less than a day ago, otherwise a full timestamp.
    """
    delta = datetime.now(dt.tzinfo) - dt
    if delta.days < 1:
        # If notification is < 1 day old, show relative time ('5 minutes ago', '12 hours ago')
        return naturaltime(dt)
    else:
        # Otherwise just return a regular timestamp
        local_time = dt.astimezone(timezone.get_current_timezone())
        return local_time.strftime("%Y/%m/%d %I:%M %p")
