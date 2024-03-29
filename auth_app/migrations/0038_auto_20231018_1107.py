# Generated by Django 3.2.9 on 2023-10-18 15:07

import auth_app.utils.constants
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth_app', '0037_userprofilequestion_category_data')
    ]

    operations = [
        migrations.AlterField(
            model_name='adminsettings',
            name='data_type',
            field=models.CharField(
                choices=[('TEXT', 'Text'), ('BOOLEAN', 'Boolean'), ('INTEGER', 'Integer'), ('DATETIME', 'Datetime'),
                         ('SELECT', 'Select')], default=auth_app.utils.constants.ADMIN_SETTINGS_TYPE['TEXT'],
                max_length=10),
        ),
        migrations.AddField(
            model_name='adminsettings',
            name='select_options',
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name='adminsettings',
            name='selected_value',
            field=models.TextField(blank=True),
        ),
    ]
