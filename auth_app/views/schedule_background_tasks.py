import datetime
import logging
from collections import defaultdict

from background_task import background
from background_task.models import Task
from django.contrib.auth.models import User

from auth_app.models import AdminSettings
from auth_app.utils import get_run_at
from auth_app.utils.constants import BACKGROUND_TASKS_NAME, BACKGROUND_TASK_DURATIONS
from communication_app.models import Notification
from communication_app.utils import background_notifications_unread_categories
from email_app.utils import EngageEmail, EmailTemplateConstants
from engage_app.models import ResearchProjectTaskAssignedUser

logger = logging.getLogger(__name__)


@background(name=BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value)
def create_notification_email_background_tasks():
    logger.info("Running Background Notifications task.")
    unread_notifications = Notification.objects.filter(read_at=None,
                                                       type__in=background_notifications_unread_categories).order_by('-created_at')
    admin_setting_notification = AdminSettings.objects.get(
        name=BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value)
    selected_value = admin_setting_notification.selected_value
    if selected_value == BACKGROUND_TASK_DURATIONS.NEVER.get('value'):
        return
    notifications_by_user = defaultdict(list)
    today = datetime.date.today()
    from_date = (today - datetime.timedelta(seconds=int(selected_value))).strftime("%B %d, %Y")
    today = today.strftime("%B %d, %Y")
    for notification in unread_notifications:
        user = notification.receiver
        notifications_by_user[user].append(notification)

    overdue_tasks = ResearchProjectTaskAssignedUser.objects.filter(
        research_project_task__due_date__lt=datetime.datetime.now(),  # Due date is in the past
        is_complete=False  # The task is not complete
    )

    overdue_tasks_dict = defaultdict(list)
    for task in overdue_tasks:
        user = task.assigned_user
        task_title = task.research_project_task.title
        due_date = task.research_project_task.due_date
        creator = task.research_project_task.task_creator

        # Create a string that combines the title and due date
        task_info = f'{task_title} (Due: {due_date}) - {creator.first_name} {creator.last_name}'

        overdue_tasks_dict[user].append(task_info)

    user_notifications = dict(notifications_by_user)

    user_overdue_tasks = dict(overdue_tasks_dict)
    users = User.objects.all()
    for user in users:
        if not user.is_active or user.is_staff:
            continue
        else:
            if user_overdue_tasks.get(user) is not None:
                overdue_tasks = user_overdue_tasks[user]
                overdue_task_params = {
                    'overdueVisibility': 'block',
                    'overdueTaskCount': len(overdue_tasks),
                    'overdueTaskTitles': overdue_tasks
                }
            else:
                overdue_task_params = {
                    'overdueVisibility': 'none',
                    'overdueTaskCount': 0,
                    'overdueTaskTitles': []
                }
            if user_notifications.get(user) is not None:
                notifications = user_notifications[user]
                category_count_by_user = defaultdict(int)
                for notification in notifications:
                    category_count_by_user[notification.type] = category_count_by_user.get(notification.type, 0) + 1
                category_count = dict(category_count_by_user)
                category_count['Task Updates'] = overdue_task_params.get('overdueTaskCount')
                research_project = category_count.get('Research Project', 0)
                if research_project != 0:
                    category_count.pop('Research Project')
                category_count['Project Updates'] = research_project
                notification_params = {
                    'notificationVisibility': 'block',
                    'categoryCounts': category_count,
                    'notifications': notifications,
                    'totalCount': len(notifications),
                    'hasNotifications': True
                }
            else:
                category_count = {'Project Updates': 0, 'Task Updates': 0}
                notification_params = {
                    'notificationVisibility': 'none',
                    'categoryCounts': category_count,
                    'notifications': [],
                    'totalCount': 0,
                    'hasNotifications': False
                }
            if admin_setting_notification.selected_value == BACKGROUND_TASK_DURATIONS.DAILY.get('value'):
                recurrence_setting = 'Daily'
            elif admin_setting_notification.selected_value == BACKGROUND_TASK_DURATIONS.WEEKLY.get('value'):
                recurrence_setting = 'Weekly'
            elif admin_setting_notification.selected_value == BACKGROUND_TASK_DURATIONS.BI_WEEKLY.get('value'):
                recurrence_setting = 'Bi-weekly'
            else:
                recurrence_setting = 'Yearly'
            if user.last_login is None:
                last_login = 'You have never logged in'
            else:
                last_login = f'It has been {(datetime.datetime.now().date() - user.last_login.date()).days} days since you have last logged in'

            user_notification_params = {
                **notification_params,
                **overdue_task_params,
                'fromDate': from_date,
                'today': today,
                'user': user,
                'recurrenceSetting': recurrence_setting,
                'lastLogin': last_login

            }
            background_notification_update = EngageEmail(
                subject='Unread Notifications Update.',
                template_name=EmailTemplateConstants.BACKGROUND_NOTIFICATIONS_EMAIL,
                template_params=user_notification_params
            )
            # Set recipients
            background_notification_update.set_recipients([user.email])
            background_notification_update.send()
    if admin_setting_notification.selected_value == BACKGROUND_TASK_DURATIONS.YEARLY.get('value') \
            or admin_setting_notification == BACKGROUND_TASK_DURATIONS.MONTHLY.get('value'):
        Task.objects.get(task_name=BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value).delete()
        create_notification_email_background_tasks(schedule=get_run_at(admin_setting_notification,
                                                                       AdminSettings.objects.get(
                                                                           name=BACKGROUND_TASKS_NAME.PERIODIC_EMAILS_STARTS.value)),
                                                   repeat=int(admin_setting_notification.selected_value))
