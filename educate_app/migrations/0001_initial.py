# Generated by Django 3.2.9 on 2023-12-07 18:51

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid

from engage_app.utils import DateTypes


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth_app', '0039_background_tasks_admin_settings'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Classroom',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.TextField(null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_using_start_date', models.BooleanField(blank=True, null=True)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('start_date_type', models.TextField(blank=True, choices=DateTypes.to_list(), null=True)),
                ('is_using_end_date', models.BooleanField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('end_date_type', models.TextField(blank=True, choices=DateTypes.to_list(), null=True)),
                ('creator', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='classroom_creator', to=settings.AUTH_USER_MODEL)),
                ('research_interests', models.ManyToManyField(to='auth_app.ResearchInterest')),
            ],
        ),
        migrations.CreateModel(
            name='ClassroomParticipants',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_teacher_assistant', models.BooleanField(default=False)),
                ('is_instructor', models.BooleanField(default=False)),
                ('is_student', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=False)),
                ('join_date', models.DateTimeField(blank=True, null=True)),
                ('classroom', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='educate_app_classroomparticipants_related_class', to='educate_app.classroom')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='educate_app_classroomparticipants_related_user', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
