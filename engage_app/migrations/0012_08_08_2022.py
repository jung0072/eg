from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('engage_app', '0011_08_05_2022'),
    ]

    operations = [
        migrations.AddField(
            model_name='researchproject',
            name='is_ready_for_review',
            field=models.BooleanField(default=False)
        ),
        migrations.AddField(
            model_name='researchproject',
            name='review_date',
            field=models.DateTimeField(default=None, blank=True, null=True)
        ),
    ]
