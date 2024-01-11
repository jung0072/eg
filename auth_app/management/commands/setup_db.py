import os
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Run the Django Migrations and Download Cities Light Tables/ Data. Then render the front-end react app'

    def handle(self, *args, **options):
        os.system("python manage.py migrate")
        os.system("python manage.py cities_light --progress")
        os.system("python manage.py render_app")
