# Generated by Django 3.2.9 on 2022-07-18 16:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth_app', '0006_06_22_2022'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='research_interests',
            field=models.ManyToManyField(to='auth_app.ResearchInterest'),
        ),
    ]
