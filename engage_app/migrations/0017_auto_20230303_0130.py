# Generated by Django 3.2.9 on 2023-03-03 01:30

from django.db import migrations, models
from engage_app.utils import ResearchStudyTypes, ResearchStudyFormats


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0016_researchprojecttask_due_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='researchproject',
            name='centre_format',
            field=models.TextField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='researchproject',
            name='contact_name',
            field=models.TextField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='researchproject',
            name='criteria',
            field=models.TextField(blank=True, max_length=1024, null=True),
        ),
        migrations.AddField(
            model_name='researchproject',
            name='goal_of_project',
            field=models.TextField(blank=True, max_length=1024, null=True),
        ),
        migrations.AddField(
            model_name='researchproject',
            name='is_contact_visible',
            field=models.BooleanField(blank=True, default=False, null=True),
        ),
        migrations.AddField(
            model_name='researchproject',
            name='study_format',
            field=models.TextField(blank=True, choices=ResearchStudyTypes.to_list(), null=True),
        ),
        migrations.AddField(
            model_name='researchproject',
            name='subject',
            field=models.TextField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='researchproject',
            name='summary',
            field=models.TextField(blank=True, max_length=1024, null=True),
        ),
        migrations.AddField(
            model_name='researchproject',
            name='type',
            field=models.TextField(blank=True, choices=ResearchStudyFormats.to_list(), null=True),
        )
    ]