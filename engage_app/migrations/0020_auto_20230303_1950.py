import django.contrib.postgres.fields
from django.db import migrations, models
from engage_app.utils import UserRoles, ResearchStudyFormats


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0019_03_03_2023'),
    ]

    operations = [
        migrations.AddField(
            model_name='researchprojecttask',
            name='roles_needed',
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.TextField(choices=UserRoles.to_list(), null=True), blank=True, null=True, size=None),
        ),
        migrations.AlterField(
            model_name='researchproject',
            name='roles_needed',
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.TextField(choices=UserRoles.to_list(), null=True), size=None),
        ),
        migrations.AlterField(
            model_name='researchproject',
            name='study_format',
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.TextField(blank=True, choices=ResearchStudyFormats.to_list(), null=True),
                null=True, blank=True, max_length=2, size=None
            ),
        ),
    ]
