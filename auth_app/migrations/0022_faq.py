from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from django.contrib.auth.models import User
from engage_app.utils.constants import FAQTypes

from auth_app.models import FAQ


def create_faq(apps, schema_editor):
    admin = User.objects.get(username='admin')
    FAQ.objects.create(
        title="Temp FAQ", description="This is a temp FAQ", submitter=admin, faq_type=FAQTypes.GENERAL.name
    )


def reverse_create_faq(apps, schema_editor):
    FAQ.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('auth_app', '0021_faq'),
    ]

    operations = [
        migrations.RunPython(create_faq, reverse_code=reverse_create_faq),
    ]
