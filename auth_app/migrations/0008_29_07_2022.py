from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0007_07_18_2022'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='experience',
            field=models.TextField(blank=True, null=True)
        )
    ]
