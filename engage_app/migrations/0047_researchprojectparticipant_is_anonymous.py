# Generated by Django 3.2.9 on 2023-11-13 19:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('engage_app', '0046_researchproject_is_archived'),
    ]

    operations = [
        migrations.AddField(
            model_name='researchprojectparticipant',
            name='is_anonymous',
            field=models.BooleanField(default=False),
        ),
    ]
