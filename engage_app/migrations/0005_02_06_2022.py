from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('engage_app', '0004_01_28_2022'),
    ]

    operations = [
        migrations.CreateModel(
            name='ResearchProjectTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.TextField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('research_project', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name='parent_research_project',
                    to='engage_app.researchproject'
                )),
                ('task_creator', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name='research_task_creator',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
        ),
    ]
