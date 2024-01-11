from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from engage_app.utils import ResearchStudyReminderTypes, ResearchStudyTypes, ResearchStudyFormats


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('engage_app', '0017_auto_20230303_0130'),
    ]

    operations = [
        migrations.AlterField(
            model_name='researchproject',
            name='study_format',
            field=models.TextField(blank=True, choices=ResearchStudyFormats.to_list(), null=True),
        ),
        migrations.AlterField(
            model_name='researchproject',
            name='type',
            field=models.TextField(blank=True, choices=ResearchStudyTypes.to_list(), null=True),
        ),
        migrations.CreateModel(
            name='CalendarReminder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=ResearchStudyReminderTypes.to_list(), max_length=1024)),
                ('tag_colour', models.CharField(blank=True, default='#F5F5F5', max_length=9, null=True)),
                ('description', models.CharField(blank=True, max_length=1024, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='ResearchProjectCalendarReminder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('calendar_reminder', models.ForeignKey(
                    'CalendarReminder', related_name="project_calendar_reminder", on_delete=models.CASCADE
                )),
                ('creator',
                 models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='project_reminder_creator',
                                   to=settings.AUTH_USER_MODEL)),
                ('research_task',
                 models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reminder_research_task',
                                   to='engage_app.researchprojecttask')),
            ],
        )
    ]
