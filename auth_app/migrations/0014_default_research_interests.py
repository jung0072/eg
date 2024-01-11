import os

from django.db import migrations
from django.utils import timezone

from auth_app.utils import reverse_create_model
from engage_app.utils import ResearchInterestTypes
from config.settings import BASE_DIR


def create_initial_research_project_interests(apps, schema_editor):
    # Grab the model
    ResearchInterest = apps.get_model("auth_app", "ResearchInterest")

    # Grab the file of initial research interests
    research_interests_file = os.path.join(BASE_DIR, 'auth_app', 'static', 'data', 'initial_research_interests.txt')
    research_comorbidity_file = os.path.join(BASE_DIR, 'auth_app', 'static', 'data', 'initial_comorbidities.txt')
    research_icu_interventions_file = os.path.join(BASE_DIR, 'auth_app', 'static', 'data', 'initial_icu_interventions.txt')
    research_icu_admissions_file = os.path.join(BASE_DIR, 'auth_app', 'static', 'data', 'initial_icu_admissions.txt')
    research_icu_occurrences_file = os.path.join(BASE_DIR, 'auth_app', 'static', 'data', 'initial_icu_occurrences.txt')
    initial_institutions = os.path.join(BASE_DIR, 'auth_app', 'static', 'data', 'initial_institutions.txt')

    research_interests_dict = [
        dict(file=research_interests_file, type=ResearchInterestTypes.RESEARCH.name),
        dict(file=research_comorbidity_file, type=ResearchInterestTypes.COMORBIDITY.name),
        dict(file=research_icu_interventions_file, type=ResearchInterestTypes.ICU_INTERVENTIONS.name),
        dict(file=research_icu_admissions_file, type=ResearchInterestTypes.ICU_ADMISSIONS.name),
        dict(file=research_icu_occurrences_file, type=ResearchInterestTypes.ICU_OCCURRENCES.name),
        dict(file=initial_institutions, type=ResearchInterestTypes.INSTITUTION.name),
    ]

    # Prepare some variables for our loop
    last_item = None  # The last item we added
    stack = []  # The parents in our current hierarchy
    indent_level = 0  # The level of indentation on the last-read line
    indent_size = 2  # The number of spaces per indent level in the file

    # Get a reference to the admin account that was created just before this migration was run
    User = apps.get_model('auth', 'User')
    admin = User.objects.filter(username='admin').first()

    for research_interest in research_interests_dict:
        # Iterate over the lines in the file, adding them to the database
        with open(research_interest['file'], 'r') as file:
            for line in file:
                # Get the name of the research interest
                line = line.rstrip()
                research_interest_name = line.lstrip()

                # Check what indentation level this is at
                line_indent_level = int((len(line) - len(research_interest_name)) / indent_size)
                if line_indent_level > indent_level:
                    # If it's greater than the previous, push the last item into the stack
                    stack.append(last_item)
                elif line_indent_level < indent_level:
                    # If it's less than the previous, pop the previous parent off the stack
                    for _ in range(indent_level - line_indent_level):
                        stack.pop()
                indent_level = line_indent_level

                # Create the research interest in the database
                parent = stack[-1] if stack else None
                last_item = ResearchInterest.objects.create(
                    title=research_interest_name, parent_interest=parent,
                    created_by=admin, approved_by=admin, approved_at=timezone.now(),
                    type=research_interest['type']
                )


def create_admin_user(apps, schema_editor):
    # Get a reference to user model to create the admin user
    User = apps.get_model('auth', 'User')

    # Check to see if we have an existing admin user then we can ignore creating this.
    existing_admin = User.objects.filter(username="admin")
    if not existing_admin.exists():
        # set the initial values for the admin for engage
        username = "admin"
        email = "engage@insightscope.ca"
        password = "EngageIC4U2023W!"
        admin_user = User.objects.create_superuser(username, email, password)

        # set any extra info on the admin account before saving again
        admin_user.first_name = "Admin"
        admin_user.last_name = "Account"
        admin_user.is_active = True
        admin_user.save()
        return admin_user


def reverse_create_admin_user(apps, schema_editor):
    # Get a reference to user model to create the admin user
    User = apps.get_model('auth', 'User')
    existing_admin = User.objects.get(username="admin")
    existing_admin.delete()


def reverse_create_research_interests(apps, schema_editor):
    # This just deletes all rows in the table
    reverse_create_model(apps, "auth_app", "ResearchInterest")


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0011_alter_userprofile_first_language')
    ]
    operations = [
        # Make sure to create the admin user before the following researcher interests are created
        migrations.RunPython(create_admin_user, reverse_code=reverse_create_admin_user),
        migrations.RunPython(
            create_initial_research_project_interests, reverse_code=reverse_create_research_interests
        )
    ]
