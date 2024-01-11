import os
from django.core.management.base import BaseCommand
from scripts.create_form import convert_user_profile_questions_to_react_form_json


class Command(BaseCommand):
    help = 'Run the convert_user_profile_question_to_react_form_json function as a script'

    def handle(self, *args, **options):
        os.system("npm i --prefix react_app")
        os.system("npm run build --prefix react_app/ && python manage.py collectstatic --noinput")
