from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('auth_app', '0031_alter_contactlog_priority'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='linked_to_insight_scope',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='insight_scope_id',
            field=models.IntegerField(null=True, blank=True),
        )
    ]
