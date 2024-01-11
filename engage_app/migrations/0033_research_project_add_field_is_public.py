from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('engage_app', '0032_researchprojectoption_set_order_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='researchproject',
            name='is_public',
            field=models.BooleanField(default=True),
        ),
    ]
