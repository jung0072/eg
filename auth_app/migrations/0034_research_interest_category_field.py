from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('auth_app', '0033_auto_20230731_1715'),
    ]

    operations = [
        migrations.AddField(
            model_name='researchinterest',
            name='category',
            field=models.ForeignKey(
                on_delete=models.deletion.CASCADE,
                to='auth_app.researchinterestcategory',
                null=True
            ),
        )
    ]
