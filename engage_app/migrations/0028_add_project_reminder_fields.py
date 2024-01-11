from django.db import migrations, models
from django.db.models import deletion
from django.utils import timezone


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0027_researchprojectparticipant_is_project_lead'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ResearchProjectCalendarReminder',
            name='research_task',
            field=models.ForeignKey(blank=True, null=True, on_delete=deletion.CASCADE,
                                    related_name='reminder_research_task', to='engage_app.researchprojecttask'),
        ),
        migrations.AddField(
            model_name='ResearchProjectCalendarReminder',
            name='title',
            field=models.TextField(default='Reminder', max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='ResearchProjectCalendarReminder',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='ResearchProjectCalendarReminder',
            name='due_date',
            field=models.DateTimeField(default=timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='ResearchProjectCalendarReminder',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='ResearchProjectCalendarReminder',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='ResearchProjectCalendarReminder',
            name='research_project',
            field=models.ForeignKey(on_delete=deletion.CASCADE, related_name='reminder_research_project',
                                    to='engage_app.ResearchProject', null=True),
        )
    ]
