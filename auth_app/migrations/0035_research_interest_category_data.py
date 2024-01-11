from django.db import migrations, models
from engage_app.utils import ResearchInterestTypes


def add_default_research_interest_categories(apps, schema_editor):
    parent_categories = ResearchInterestTypes.to_list()
    ResearchInterestCategory = apps.get_model('auth_app', 'ResearchInterestCategory')

    for category in parent_categories:
        ResearchInterestCategory.objects.create(
            title=category[1],
            description=category[0],
            mapping=category[0]
        )


def reverse_add_default_research_interest_categories(apps, schema_editor):
    ResearchInterestCategory = apps.get_model('auth_app', 'ResearchInterestCategory')
    ResearchInterestCategory.objects.all().delete()


def update_existing_research_interests(apps, schema_editor):
    ResearchInterestCategory = apps.get_model('auth_app', 'ResearchInterestCategory')
    ResearchInterest = apps.get_model('auth_app', 'ResearchInterest')

    research_interests = ResearchInterest.objects.all()
    for interest in research_interests:
        interest.category = ResearchInterestCategory.objects.get(mapping=interest.type)
        interest.save()


def reverse_update_existing_research_interests(apps, schema_editor):
    ResearchInterest = apps.get_model('auth_app', 'ResearchInterest')

    research_interests = ResearchInterest.objects.all()
    for interest in research_interests:
        interest.category = None
        interest.save()


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0034_research_interest_category_field'),
    ]

    operations = [
        migrations.RunPython(
            add_default_research_interest_categories,
            reverse_code=reverse_add_default_research_interest_categories
        ),
        migrations.RunPython(
            update_existing_research_interests,
            reverse_code=reverse_update_existing_research_interests
        )
    ]
