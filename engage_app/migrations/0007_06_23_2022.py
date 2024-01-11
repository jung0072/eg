# Generated by Django 3.2.9 on 2022-06-23 18:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('engage_app', '0006_06_04_2022'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='researchproject',
            name='partner_commitment_period',
        ),
        migrations.RemoveField(
            model_name='researchproject',
            name='partner_commitment_time',
        ),
        migrations.AddField(
            model_name='researchproject',
            name='partner_commitment_description',
            field=models.TextField(default='', max_length=255),
        ),
    ]