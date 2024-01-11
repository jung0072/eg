from django.db import migrations

from engage_app.models import ResearchProjectTask
from engage_app.utils import DateTypes


def set_due_date_fields(apps, schema_editor):
    # Update existing records
    ResearchProjectTask.objects.filter(due_date__isnull=False).update(
        is_using_due_date=True,
        due_date_type=DateTypes.EXACT_DATE.name
    )


def undo_set_due_date_fields(apps, schema_editor):
    # Revert the changes
    ResearchProjectTask.objects.filter(is_using_due_date=True).update(
        is_using_due_date=False,
        due_date_type=None
    )

class Migration(migrations.Migration):

    dependencies = [
        ('engage_app', '0044_auto_20231106_1302'),
    ]

    operations = [
        migrations.RunPython(set_due_date_fields, undo_set_due_date_fields),
    ]
