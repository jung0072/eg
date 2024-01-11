from django.db import migrations

from engage_app.utils import ResearchStudyReminderTypes, UserRoles


def create_initial_calendar_reminders(apps, schema_editor):
    CalendarReminder = apps.get_model("engage_app", "CalendarReminder")
    CalendarReminder.objects.create(type=ResearchStudyReminderTypes.ANNOUNCEMENT.name, tag_colour="#FAAD14")
    CalendarReminder.objects.create(type=ResearchStudyReminderTypes.CALL.name, tag_colour="#DD3434")
    CalendarReminder.objects.create(type=ResearchStudyReminderTypes.NEW_PROJECT.name, tag_colour="#DD3434")
    CalendarReminder.objects.create(type=ResearchStudyReminderTypes.MEETING.name, tag_colour="#1AB759")


def reverse_initial_calendar_reminders(apps, schema_editor):
    CalendarReminder = apps.get_model("engage_app", "CalendarReminder")
    CalendarReminder.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0018_researchprojectreminders')
    ]
    operations = [
        migrations.RunPython(create_initial_calendar_reminders, reverse_code=reverse_initial_calendar_reminders)
    ]
