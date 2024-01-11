import logging

from django.db.models.signals import post_migrate
from django.dispatch import receiver

from auth_app.models import AdminSettings
from auth_app.utils.common import get_run_at
from auth_app.utils.constants import BACKGROUND_TASKS_NAME
from auth_app.views.schedule_background_tasks import create_notification_email_background_tasks

logger = logging.getLogger(__name__)


@receiver(post_migrate)
def run_after_migrations(sender, **kwargs):
    # This function is used to create the initial background_task which will be run after the migrations
    if sender.name == 'auth_app':
        from background_task.models import Task
        background_task_system_settings = AdminSettings.objects.get(name=BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value)
        email_repetition = AdminSettings.objects.get(name=BACKGROUND_TASKS_NAME.PERIODIC_EMAILS_STARTS.value)
        try:
            background = Task.objects.get(task_name=BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value)
            logger.info("Background task already exists.... Proceeding further.")
        except Task.DoesNotExist:
            logger.info("Creating the background task as it was never created.")
            create_notification_email_background_tasks(schedule=get_run_at(background_task_system_settings, email_repetition),
                                                       repeat=int(background_task_system_settings.selected_value))
        except Task.MultipleObjectsReturned:
            logger.info(
                "There were multiple instances created for the background task... Deleting them all and creating a new one."
            )
            Task.objects.filter(task_name=BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value).delete()
            create_notification_email_background_tasks(schedule=get_run_at(background_task_system_settings, email_repetition),
                                                       repeat=int(background_task_system_settings.selected_value))
