import datetime

from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.http import require_GET

from communication_app.models import Notification
from communication_app.utils import NotificationTypes


@login_required
def view_notifications(request):
    unread_notifications = Notification.objects.filter(receiver=request.user, read_at__isnull=True).order_by(
        '-created_at')
    return render(
        request,
        'communication_app/notifications/view_notifications.html',
        {
            'unread_notifications': unread_notifications,
            'filter_types': NotificationTypes.to_list()
        })


@login_required
def read_notification(request, notification_id):
    """
    When the user clicks on a notification, they are routed through this view first which will redirect them to the
    actual link of the notification. This is just so that we can mark the notification as read.
    """
    # First make sure that notification actually exists
    try:
        notification = Notification.objects.get(pk=notification_id)
    except Notification.DoesNotExist:
        # Nope. Return them to the homepage.
        return redirect('/')

    # Then, make sure that this person is actually the receiver of the notification
    if notification.receiver != request.user:
        # Lol nope. Get outta here.
        return redirect('/')

    # Ok. They're clear to be forwarded to this notification. Mark it as read and redirect them.
    notification.read_at = datetime.datetime.now(tz=datetime.timezone.utc)
    notification.save()
    return redirect(notification.link)


@login_required
@require_GET
def notifications_json(request):
    # Create the initial queryset
    notifications = Notification.objects.filter(receiver=request.user).order_by('-created_at')

    # Check for the unread param, this one will skip all the other filters.
    if 'unread' in request.GET:
        # Return all the unread notifications only
        notifications = notifications.filter(read_at__isnull=True)
        return JsonResponse({"notifications": [n.to_json() for n in notifications]})
    else:
        # Filter to already read notifications
        notifications = notifications.filter(read_at__isnull=False)

    # Check if a filter was specified for the type
    if 'type' in request.GET:
        # Make sure the type is a valid value, if it isn't return a JsonResponse with a status code of 400 Bad Request
        filter_type = request.GET['type']
        if filter_type not in NotificationTypes.to_value_list():
            return JsonResponse({'reason': 'Filter type provided was not valid.'}, status=400)

        # Apply the filter
        notifications = notifications.filter(type=filter_type)

    # Check if a search query was provided
    if 'query' in request.GET:
        # Check the following to see if they match the provided query:
        #  - Notification content
        notifications = notifications.filter(Q(content__icontains=request.GET['query']))

    # Get and validate the offset and limit
    try:
        offset = int(request.GET['offset']) if 'offset' in request.GET else 0
        limit = int(request.GET['limit']) if 'limit' in request.GET else 15
    except ValueError:
        return JsonResponse({'reason': 'Provided offset or limit value was not an integer value.'}, status=400)

    # Execute the query and return
    return JsonResponse({"notifications": [n.to_json() for n in notifications[offset:offset + limit]]})
