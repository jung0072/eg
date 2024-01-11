from django.db import models
from engage_app.utils import ResearchStudyReminderTypes


class CalendarReminder(models.Model):
    type = models.CharField(choices=ResearchStudyReminderTypes.to_list(), max_length=1024)
    tag_colour = models.CharField(max_length=9, null=True, blank=True, default="#F5F5F5")
    description = models.CharField(max_length=1024, null=True, blank=True)

    def to_json(self):
        return dict(
            type=self.type,
            tag_colour=self.tag_colour,
            description=self.description
        )
