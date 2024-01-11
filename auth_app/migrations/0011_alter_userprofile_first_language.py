# Generated by Django 3.2.9 on 2023-02-16 18:07

import django.contrib.postgres.fields
from django.db import migrations, models
from auth_app.utils import EDITypes

class Migration(migrations.Migration):

    dependencies = [
        ('auth_app', '0010_auto_20221118_1951'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='first_language',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.TextField(blank=True, choices=EDITypes.LANGUAGE.to_list(), null=True), null=True, size=4),
        ),
    ]