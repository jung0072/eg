from django.db import models

from base_app.models.base_engage_model import BaseEngageModel


class BaseSection(BaseEngageModel):
    class Meta:
        abstract = True

    name = models.CharField(max_length=200)
    description = models.TextField()
    order_number = models.SmallIntegerField()
    is_valid_researcher = models.BooleanField()
    is_valid_patient = models.BooleanField()
    is_valid_family_of_patient = models.BooleanField()
    is_valid_caretaker_of_patient = models.BooleanField()
    is_valid_passive = models.BooleanField()
    is_published = models.BooleanField(default=False)

    def to_json(self):
        return {
            'name': self.name,
            'description': self.description,
            'order_number': self.order_number,
            'is_valid_researcher': self.is_valid_researcher,
            'is_valid_patient': self.is_valid_patient,
            'is_valid_family_of_patient': self.is_valid_family_of_patient,
            'is_valid_caretaker_of_patient': self.is_valid_caretaker_of_patient,
            'is_valid_passive': self.is_valid_passive,
            'is_published': self.is_published,
            'id': str(self.id)
        }

    def __str__(self):
        return f'{self.name} - {self.order_number}'
