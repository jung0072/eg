from django.db import migrations

from auth_app.utils.common import add_research_interest_category_to_question, \
    reverse_research_interest_categories_on_question


def add_research_interest_category(apps, schema):
    ResearchInterest = apps.get_model('auth_app', 'ResearchInterest')
    UserProfileQuestion = apps.get_model('auth_app', 'UserProfileQuestion')
    UserProfileOption = apps.get_model('auth_app', 'UserProfileOption')
    add_research_interest_category_to_question(
        question_model=UserProfileQuestion,
        option_model=UserProfileOption,
        interest_model=ResearchInterest
    )


def remove_research_interest_category(apps, schema):
    UserProfileQuestion = apps.get_model('auth_app', 'UserProfileQuestion')
    reverse_research_interest_categories_on_question(UserProfileQuestion)


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0036_userprofilequestion_research_interest_category'),
    ]

    operations = [
        migrations.RunPython(
            add_research_interest_category,
            reverse_code=remove_research_interest_category
        ),

    ]
