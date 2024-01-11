from django.db import models

from base_app.models import BaseOption


class ResearchProjectOption(BaseOption):
    question = models.ForeignKey('ResearchProjectQuestion', on_delete=models.CASCADE)
