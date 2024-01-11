import os

from django.db import migrations

from auth_app.utils.common import add_research_interest_from_file
from config.settings import BASE_DIR
from engage_app.utils import ResearchInterestTypes


def add_icu_hospitals(apps, schema):
    # get a reference to the research interest model and the new icu hospital file we will add
    ResearchInterest = apps.get_model("auth_app", "ResearchInterest")
    icu_hospital_file = os.path.join(BASE_DIR, 'auth_app', 'static', 'data', 'icu_hospitals.txt')
    # get a reference to the admin user
    User = apps.get_model('auth', 'User')
    admin = User.objects.filter(username='admin').first()
    add_research_interest_from_file(ResearchInterest, dict(
        file=icu_hospital_file, type=ResearchInterestTypes.INSTITUTION.name
    ), admin=admin)


def reverse_add_icu_hospitals(apps, schema):
    ResearchInterest = apps.get_model("auth_app", "ResearchInterest")
    icu_hospital_file = os.path.join(BASE_DIR, 'auth_app', 'static', 'data', 'icu_hospitals.txt')

    with open(icu_hospital_file, 'r') as file:
        # Get the name of the research interest
        for line in file:
            line = line.rstrip()
            research_interest_name = line.lstrip()

            # With the name of the interest query then delete it
            ResearchInterest.objects.filter(
                type=ResearchInterestTypes.INSTITUTION.name, title=research_interest_name
            ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0027_userprofileoption_set_order_number'),
    ]
    operations = [
        migrations.RunPython(add_icu_hospitals, reverse_code=reverse_add_icu_hospitals)
    ]
