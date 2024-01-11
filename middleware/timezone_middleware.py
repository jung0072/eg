from django.utils import timezone

from auth_app.models import UserProfile


class TimezoneMiddleware:
    """
    Modified from https://docs.djangoproject.com/en/4.0/topics/i18n/timezones/
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            user_profile = UserProfile.objects.get(user_id=request.user.id)
            if user_profile.timezone:
                timezone.activate(user_profile.timezone)
            else:
                timezone.deactivate()
        else:
            timezone.deactivate()
        return self.get_response(request)
