import json
import os

from django.db import migrations

from config.settings import BASE_DIR
from auth_app.utils import create_question_from_json, create_sections_from_json_list, reverse_create_model


def create_initial_research_project_sections(apps, schema_editor):
    # STUB: Function contents removed as a newer migration now handles this
    pass


def reverse_create_initial_research_project_sections(apps, schema_editor):
    reverse_create_model(apps, "engage_app", "ResearchProjectSection")


def create_initial_research_project_questions(apps, schema_editor):
    # STUB: Function contents removed as a newer migration now handles this
    pass


def reverse_create_initial_research_project_questions(apps, schema_editor):
    # delete the models in order of dependency
    reverse_create_model(apps, "engage_app", "ResearchProjectQuestionOptionDependency")
    reverse_create_model(apps, "engage_app", "ResearchProjectOption")
    reverse_create_model(apps, "engage_app", "ResearchProjectQuestion")


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0002_12_02_2021'),
    ]

    operations = [
        migrations.RunPython(
            create_initial_research_project_sections, reverse_code=reverse_create_initial_research_project_sections
        ),
        migrations.RunPython(
            create_initial_research_project_questions, reverse_code=reverse_create_initial_research_project_questions
        )
    ]
