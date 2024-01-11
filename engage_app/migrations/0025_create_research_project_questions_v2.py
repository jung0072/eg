import json
import os

from django.db import migrations

from auth_app.utils import create_question_from_json, create_sections_from_json_list, reverse_create_model
from config.settings import BASE_DIR


def create_initial_research_project_questions(apps, schema_editor):
    #  First get a reference to all of the relevant models
    ResearchProjectQuestion = apps.get_model("engage_app", "ResearchProjectQuestion")
    ResearchProjectSection = apps.get_model("engage_app", "ResearchProjectSection")
    ResearchProjectOption = apps.get_model("engage_app", "ResearchProjectOption")
    ResearchInterests = apps.get_model("auth_app", "ResearchInterest")
    ResearchProjectQuestionOptionDependency = apps.get_model("engage_app", "ResearchProjectQuestionOptionDependency")

    # now delete any existing research project questions from the database
    # TODO: Update old migration so it does not execute any code and remove this deletion
    reverse_create_research_project_questions(apps, schema_editor)

    #  Now get a reference to the section json data and then create the research project sections
    sections_json_file_path = os.path.join(
        BASE_DIR, 'auth_app', 'static', 'data', 'research_project_sections_v2.json'
    )
    create_sections_from_json_list(sections_json_file_path, ResearchProjectSection)

    # Now with sections created create all of the corresponding questions
    question_json_file_path = os.path.join(
        BASE_DIR, 'auth_app', 'static', 'data', 'research_project_questions_v2.json'
    )

    with open(question_json_file_path, 'r', encoding="cp866") as initial_research_project_questions_file:
        data = json.load(initial_research_project_questions_file)
        initial_research_project_sections_json = data['questions']
        developer_code_list = []
        for question in initial_research_project_sections_json:
            create_question_from_json(
                question, ResearchProjectQuestion, ResearchProjectSection, ResearchProjectOption,
                ResearchProjectQuestionOptionDependency, ResearchInterests, developer_code_list
            )


def reverse_create_research_project_questions(apps, schema_editor):
    # delete the models in order of dependency
    reverse_create_model(apps, "engage_app", "ResearchProjectQuestion")
    reverse_create_model(apps, "engage_app", "ResearchProjectQuestionOptionDependency")
    reverse_create_model(apps, "engage_app", "ResearchProjectOption")
    reverse_create_model(apps, "engage_app", "ResearchProjectSection")


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0024_modify_research_project_fields')
    ]

    operations = [
        migrations.RunPython(
            create_initial_research_project_questions, reverse_code=reverse_create_research_project_questions
        )
    ]
