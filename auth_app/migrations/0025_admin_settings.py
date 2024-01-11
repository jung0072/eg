from django.db import migrations, models
from auth_app.utils import ADMIN_SETTINGS_TYPE, ADMIN_SETTINGS_NAME, ADMIN_SYSTEM_SETTINGS_LIST

def create_admin_settings(apps, schema_editor):
    # Get the AdminSettings model
    AdminSettings = apps.get_model('auth_app', 'AdminSettings')

    # Convert ADMIN_SYSTEM_SETTINGS_LIST dictionaries to AdminSettings instances
    admin_settings_to_create = [
        AdminSettings(
            name=item['name'],
            data_type=item['data_type'],
        )
        for item in ADMIN_SYSTEM_SETTINGS_LIST
    ]
    AdminSettings.objects.bulk_create(admin_settings_to_create)


def reverse_admin_settings(apps, schema_editor):
    # Get the AdminSettings model
    AdminSettings = apps.get_model('auth_app', 'AdminSettings')

    # Delete both "Approval Required for Researchers" and "Approval Required for Projects" settings
    AdminSettings.objects.filter(name__in=ADMIN_SETTINGS_NAME.to_value_list()).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('auth_app', '0024_alter_faq_faq_type'),
    ]

    operations = [
        migrations.CreateModel(
            name='AdminSettings',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.TextField(unique=True)),
                ('data_type', models.CharField(choices=ADMIN_SETTINGS_TYPE.to_list(), default=ADMIN_SETTINGS_TYPE.TEXT.value, max_length=10)),
                ('text_value', models.TextField(blank=True)),
                ('bool_value', models.NullBooleanField(default=True)),
                ('int_value', models.BigIntegerField(default=0)),
                ('date_value', models.DateTimeField(blank=True, null=True)),
            ],
        ),
        migrations.RunPython(create_admin_settings, reverse_admin_settings),
    ]
