from django.db import migrations, models
from engage_app.utils.constants import ContactLogPriorityTypes


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0030_auto_20230928_1451'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contactlog',
            name='priority',
            field=models.CharField(
                blank=True, choices=ContactLogPriorityTypes.to_list(), default='NOT', max_length=255, null=True
            ),
        ),
    ]
