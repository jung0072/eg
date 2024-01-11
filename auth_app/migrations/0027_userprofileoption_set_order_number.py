from django.db import migrations

from auth_app.utils import add_order_number_field_to_existing_options, \
    reverse_add_order_number_field_to_existing_options


def add_order_number_field_to_user_profile_options(apps, schema_editor):
    UserProfileOption = apps.get_model('auth_app', 'UserProfileOption')
    add_order_number_field_to_existing_options(UserProfileOption)


def reverse_add_order_number_field_to_user_profile_options(apps, schema_editor):
    UserProfileOption = apps.get_model('auth_app', 'UserProfileOption')
    reverse_add_order_number_field_to_existing_options(UserProfileOption)


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0026_userprofileoption_order_number'),
    ]

    operations = [
        migrations.RunPython(
            add_order_number_field_to_user_profile_options,
            reverse_code=reverse_add_order_number_field_to_user_profile_options
        )
    ]
