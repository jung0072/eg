import django.contrib.postgres.fields
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0029_alter_researchprojectcalendarreminder_research_project'),
    ]

    operations = [
        migrations.AlterField(
            model_name='researchproject',
            name='study_format',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.TextField(blank=True, null=True), blank=True, null=True, size=None),
        ),
        migrations.AlterField(
            model_name='researchproject',
            name='type',
            field=models.TextField(blank=True, null=True),
        )
    ]
