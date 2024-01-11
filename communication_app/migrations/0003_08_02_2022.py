from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('communication_app', '0002_06_15_2022'),
    ]

    operations = [
        migrations.AlterField(
            model_name='message',
            name='content',
            field=models.CharField(max_length=4000)
        ),
    ]
