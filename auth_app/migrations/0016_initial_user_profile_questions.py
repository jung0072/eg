import json
import os

from django.db import migrations

from config.settings import BASE_DIR
from auth_app.utils import create_question_from_json, create_sections_from_json_list, reverse_create_model


def create_initial_user_profile_sections(apps, schema_editor):
    # First create the user profile sections
    UserProfileSection = apps.get_model("auth_app", "UserProfileSection")
    sections_json_file_path = os.path.join(BASE_DIR, 'auth_app', 'static', 'data', 'user_profile_sections_v2.json')
    create_sections_from_json_list(sections_json_file_path, UserProfileSection)


def reverse_create_initial_user_profile_sections(apps, schema_editor):
    reverse_create_model(apps, "auth_app", "UserProfileSection")


def create_initial_user_profile_questions(apps, schema_editor):
    UserProfileQuestion = apps.get_model("auth_app", "UserProfileQuestion")
    UserProfileSection = apps.get_model("auth_app", "UserProfileSection")
    UserProfileOption = apps.get_model("auth_app", "UserProfileOption")
    UserProfileQuestionOptionDependency = apps.get_model("auth_app", "UserProfileQuestionOptionDependency")
    ResearchInterests = apps.get_model("auth_app", "ResearchInterest")
    question_json_file_path = os.path.join(
        BASE_DIR, 'auth_app', 'static', 'data', 'user_profile_questions_v2.json'
    )

    with open(question_json_file_path, 'r', encoding="cp866") as initial_user_profile_questions_file:
        data = json.load(initial_user_profile_questions_file)
        initial_user_profile_sections_json = data['questions']
        developer_code_list = []
        for question in initial_user_profile_sections_json:
            create_question_from_json(
                question, UserProfileQuestion, UserProfileSection, UserProfileOption,
                UserProfileQuestionOptionDependency, ResearchInterests, developer_code_list
            )


def reverse_create_initial_user_profile_questions(apps, schema_editor):
    # Get references to all the models to be deleted in order of deletion
    UserProfileQuestionOptionDependency = apps.get_model("auth_app", "UserProfileQuestionOptionDependency")
    UserProfileOption = apps.get_model("auth_app", "UserProfileOption")
    UserProfileQuestion = apps.get_model("auth_app", "UserProfileQuestion")

    # using the queryset of all objects in the database delete all of the model entries
    UserProfileQuestionOptionDependency.objects.all().delete()
    UserProfileOption.objects.all().delete()
    UserProfileQuestion.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0015_userprofile_date_of_birth'),
    ]

    operations = [
        migrations.RunPython(
            create_initial_user_profile_sections, reverse_code=reverse_create_initial_user_profile_sections
        ),
        migrations.RunPython(
            create_initial_user_profile_questions, reverse_code=reverse_create_initial_user_profile_questions
        )
    ]
