from django.db import migrations

from auth_app.utils.common import add_research_interest_category_to_question, \
    reverse_research_interest_categories_on_question


def add_research_interest_category(apps, schema):
    ResearchInterest = apps.get_model('auth_app', 'ResearchInterest')
    ResearchProjectQuestion = apps.get_model('engage_app', 'ResearchProjectQuestion')
    ResearchProjectOption = apps.get_model('engage_app', 'ResearchProjectOption')
    add_research_interest_category_to_question(
        question_model=ResearchProjectQuestion,
        option_model=ResearchProjectOption,
        interest_model=ResearchInterest
    )


def remove_research_interest_category(apps, schema):
    ResearchProjectQuestion = apps.get_model('engage_app', 'ResearchProjectQuestion')
    reverse_research_interest_categories_on_question(ResearchProjectQuestion)


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0040_researchprojectquestion_research_interest_category'),
    ]

    operations = [
        migrations.RunPython(
            add_research_interest_category,
            reverse_code=remove_research_interest_category
        ),

    ]
