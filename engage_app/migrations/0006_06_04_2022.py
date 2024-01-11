from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('engage_app', '0005_02_06_2022'),
    ]

    operations = [
        migrations.AddField(
            model_name='researchprojecttask',
            name='survey_link',
            field=models.URLField(blank=True, default='', null=True),
        ),
        migrations.AddField(
            model_name='researchproject',
            name='is_complete',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="researchproject",
            name="contact_email",
            field=models.EmailField(null=True, blank=True, max_length=255)
        ),
        migrations.AddField(
            model_name='researchprojectparticipant',
            name='is_approved',
            field=models.BooleanField(default=False),
        ),
    ]
