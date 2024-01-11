from django.db import migrations, models
from auth_app.utils import EDITypes
from django.contrib.postgres.fields import ArrayField


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='first_language',
            field=models.TextField(blank=True, choices=EDITypes.LANGUAGE.to_list(), null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='gender',
            field=models.TextField(blank=True, choices=EDITypes.GENDER.to_list(), null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='has_disability',
            field=models.TextField(blank=True, choices=EDITypes.BOOL.to_list(), null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='is_identified_native',
            field=models.TextField(blank=True, choices=EDITypes.BOOL.to_list(), null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='is_visible_minority',
            field=models.TextField(blank=True, choices=EDITypes.BOOL.to_list(), null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='most_used_language',
            field=ArrayField(
                base_field=models.TextField(blank=True, choices=EDITypes.LANGUAGE.to_list(), null=True),
                null=True, size=4
            ),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='population_group',
            field=models.TextField(blank=True, choices=EDITypes.POPULATION.to_list(), null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='sexual_orientation',
            field=models.TextField(blank=True, choices=EDITypes.SEX.to_list(), null=True),
        ),
    ]
