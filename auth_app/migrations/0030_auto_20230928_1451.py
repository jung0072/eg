from django.db import migrations, models
from engage_app.utils.constants import ContactLogActionTypes, ContactLogPriorityTypes


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0029_auto_20230922_1500'),
    ]

    operations = [
        migrations.AddField(
            model_name='contactlog',
            name='action_stage',
            field=models.CharField(
                blank=True, choices=ContactLogActionTypes.to_list(), max_length=255, null=True,
                default=ContactLogActionTypes.PENDING.name
            ),
        ),
        migrations.AddField(
            model_name='contactlog',
            name='is_complete',
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AddField(
            model_name='contactlog',
            name='priority',
            field=models.CharField(
                blank=True, choices=ContactLogPriorityTypes.to_list(), max_length=255, null=True,
                default=ContactLogPriorityTypes.LOW.name
            ),
        ),
    ]
