# Generated by Django 3.2.9 on 2023-10-23 20:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('engage_app', '0038_researchprojecttask_hide_submitted_files'),
    ]

    operations = [
        migrations.AddField(
            model_name='researchprojecttask',
            name='is_complete',
            field=models.BooleanField(default=False),
        ),
    ]