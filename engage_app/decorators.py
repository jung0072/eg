from django.contrib.auth.decorators import user_passes_test
from django.http.response import HttpResponseForbidden


def admin_required(view_function):
    def wrapped(request, *args, **kwargs):
        if request.user.is_authenticated and request.user.is_superuser:
            return view_function(request, *args, **kwargs)
        else:
            return HttpResponseForbidden("")
    return wrapped


def admin_required_ajax(view_function=None):
    actual_decorator = user_passes_test(lambda u: u.is_superuser and u.is_staff)

    if view_function:
        return actual_decorator(view_function)

    return actual_decorator
