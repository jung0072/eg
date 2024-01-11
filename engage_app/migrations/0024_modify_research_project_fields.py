from django.db import migrations, models

from engage_app.utils import ParticipantDemographicTypes, ProjectRecruitingStatus


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0023_researchprojecttask_subject'),
        ('auth_app', '0014_default_research_interests')
    ]

    operations = [
        migrations.AddField(
            model_name='researchproject',
            name='has_specific_team_demographics',
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AddField(
            model_name='researchproject',
            name='has_social_media_links',
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AddField(
            model_name='researchproject',
            name="participant_demographics_type",
            field=models.CharField(
                null=True, blank=True, choices=ParticipantDemographicTypes.to_list(), max_length=200
            )
        ),
        migrations.AddField(
            model_name="researchproject",
            name="recruiting_status",
            field=models.TextField(choices=ProjectRecruitingStatus.to_list(), null=True, blank=True)
        )
    ]
