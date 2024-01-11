from django.db import migrations
from auth_app.utils import BACKGROUND_TASK_LIST


def create_background_tasks(apps, schema_editor):
    AdminSettings = apps.get_model('auth_app', 'AdminSettings')

    background_tasks_to_create = [
        AdminSettings(
            name=item['name'],
            data_type=item['data_type'],
            select_options=item['select_options'],
            selected_value=item['selected_value'],
            text_value=item['text_value']
        )
        for item in BACKGROUND_TASK_LIST
    ]
    AdminSettings.objects.bulk_create(background_tasks_to_create)


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0038_auto_20231018_1107'),
    ]

    operations = [
        migrations.RunPython(create_background_tasks)
    ]
