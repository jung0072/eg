# Generated by Django 3.2.9 on 2023-03-08 15:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('engage_app', '0021_auto_20230305_1941'),
    ]

    operations = [
        migrations.AlterField(
            model_name='researchprojectsection',
            name='description',
            field=models.TextField(),
        ),
    ]