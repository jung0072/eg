# Generated by Django 3.2.9 on 2023-11-20 18:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth_app', '0039_background_tasks_admin_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='is_anonymous',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='opt_out_project_invitations',
            field=models.BooleanField(default=False),
        ),
    ]
