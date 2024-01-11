from django.http import HttpResponseRedirect
from django.shortcuts import render, get_object_or_404, reverse, redirect

from communication_app.models import Notification
from communication_app.utils import NotificationTypes
from engage_app.decorators import admin_required
from engage_app.forms.system_message import SystemMessageForm
from engage_app.models import SystemMessage


def view_system_message(request, slug):
    # Just send back the template using the object
    system_message = get_object_or_404(SystemMessage, pk=slug)
    return render(request, "engage_app/system/view_system_message.html", {
        "system_message": system_message,
    })


@admin_required
def edit_system_message(request, slug=''):
    # Make sure this announcement exists first
    system_announcement = get_object_or_404(SystemMessage, pk=slug)
    if request.method == 'POST':
        # Read the form from the request data
        data = request.POST.copy()
        data['slug'] = slug
        form = SystemMessageForm(data, instance=system_announcement)

        # Validate the form
        if form.is_valid():
            # Save the new data
            form.save()

            # Mark any notifications from this system message as unread so they appear again for the users
            # Delete all notifications that point to this system message
            all_notifications = Notification.objects.filter(type=NotificationTypes.SYSTEM.value, link__contains=system_announcement.slug)
            for notification in all_notifications:
                notification.read_at = None
                notification.save()

            return HttpResponseRedirect(reverse('engage_app:view_system_message', args=[system_announcement.slug]))
    else:
        # Send back the initial form
        form = SystemMessageForm(instance=system_announcement)
        form.fields['slug'].disabled = True

    # Form was either not valid or non-existent
    return render(request, "engage_app/system/edit_system_message.html", {
        "form": form,
    })


@admin_required
def create_system_message(request):
    if request.method == 'POST':
        # Read the form from the request data
        form = SystemMessageForm(request.POST)

        # Validate the form
        if form.is_valid():
            # Check if we need to generate a slug for this article
            form.cleaned_data['slug'] = form.cleaned_data['slug'] or SystemMessage.auto_slug(form.cleaned_data['title'])

            # Create the model and redirect the user to the new page
            message = SystemMessage.objects.create(
                author=request.user,
                type=form.cleaned_data['type'],
                title=form.cleaned_data['title'],
                content=form.cleaned_data['content'],
                slug=form.cleaned_data['slug']
            )
            return HttpResponseRedirect(reverse('engage_app:view_system_message', args=[message.slug]))
    else:
        # Send back the initial form
        form = SystemMessageForm()

    # Form was either not valid or non-existent
    return render(request, "engage_app/system/edit_system_message.html", {
        "form": form,
    })


@admin_required
def delete_system_message(request, slug):
    # Get the message object
    system_message = get_object_or_404(SystemMessage, pk=slug)

    # Check if we're GETing or POSTing
    if request.method == 'GET':
        # Send back the confirmation page
        return render(request, "engage_app/system/delete_system_message.html", {
            "system_message": system_message,
        })
    else:
        # Delete the message and then find all notifications created from it, delete those and
        # redirect back to the homepage
        system_notification_list = Notification.objects.filter(
            type=NotificationTypes.SYSTEM.value,
            link=reverse('engage_app:view_system_message', args=[system_message.slug]),
            content=f'{system_message.title}',
        )

        # First delete the system notifications and then delete the corresponding system message
        for system_notification in system_notification_list:
            system_notification.delete()

        # Delete the message, and redirect back to the homepage
        system_message.delete()
        return redirect('/')

