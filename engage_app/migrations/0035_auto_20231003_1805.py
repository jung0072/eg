# Generated by Django 3.2.9 on 2023-10-03 18:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('engage_app', '0034_alter_systemmessage_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='researchprojectparticipant',
            name='is_archived',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='researchprojectparticipant',
            name='prompt_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
