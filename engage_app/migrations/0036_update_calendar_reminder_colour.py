from django.db import migrations


def update_calendar_reminder_colour(apps, schema_editor):
    CalendarReminder = apps.get_model('engage_app', 'CalendarReminder')

    # Find the first CalendarReminder with type="NEW_PROJECT"
    reminder = CalendarReminder.objects.filter(type="NEW_PROJECT").first()

    # Update the color to "#AA64A9" (CHEO Secondary Purple)
    if reminder:
        reminder.tag_colour = "#AA64A9"
        reminder.save()


def reverse_calendar_reminder_colour(apps, schema_editor):
    CalendarReminder = apps.get_model('engage_app', 'CalendarReminder')

    # Find the first CalendarReminder with type="NEW_PROJECT"
    reminder = CalendarReminder.objects.filter(type="NEW_PROJECT").first()

    # Update the color back to its original
    if reminder:
        reminder.tag_colour = "#DD3434"
        reminder.save()


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0035_auto_20231003_1805')
    ]

    operations = [
        migrations.RunPython(update_calendar_reminder_colour, reverse_code=reverse_calendar_reminder_colour),
    ]
