from django.db import models

from base_app.models.base_engage_model import BaseEngageModel


class BaseOption(BaseEngageModel):
    class Meta:
        abstract = True

    title = models.CharField(max_length=200)
    mapping = models.CharField(null=True, blank=True, max_length=200)
    order_number = models.SmallIntegerField()

    def to_json(self):
        return dict(
            id=str(self.id),
            title=self.title,
            mapping=self.mapping
        )
