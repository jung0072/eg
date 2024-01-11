from django.db import migrations

from auth_app.utils import add_order_number_field_to_existing_options, \
    reverse_add_order_number_field_to_existing_options


def add_order_number_field_to_user_profile_options(apps, schema_editor):
    ResearchProjectOption = apps.get_model('engage_app', 'ResearchProjectOption')
    add_order_number_field_to_existing_options(ResearchProjectOption)


def reverse_add_order_number_field_to_user_profile_options(apps, schema_editor):
    ResearchProjectOption = apps.get_model('engage_app', 'ResearchProjectOption')
    reverse_add_order_number_field_to_existing_options(ResearchProjectOption)


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0031_researchprojectoption_order_number'),
    ]

    operations = [
        migrations.RunPython(
            add_order_number_field_to_user_profile_options,
            reverse_code=reverse_add_order_number_field_to_user_profile_options
        )
    ]
