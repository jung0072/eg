import os
import json

from django.db import migrations, models

from config.settings import BASE_DIR
from django.conf import settings
from engage_app.utils import ClinicalAreas
from engage_app.utils import PartnerCommitmentPeriods
from auth_app.utils import reverse_create_model


def create_initial_research_project_interests(apps, schema_editor):
    # STUB: Function contents removed as a newer migration now handles this
    pass


def reverse_create_research_interests(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0001_initial')
    ]
    operations = [
        migrations.RunPython(
            create_initial_research_project_interests, reverse_code=reverse_create_research_interests
        )
    ]
