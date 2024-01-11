from django.db import models
from django.contrib.auth.models import User


class ResearchProjectCalendarReminder(models.Model):
    research_project = models.ForeignKey(
        'ResearchProject', related_name="reminder_research_project", on_delete=models.CASCADE
    )
    creator = models.ForeignKey(User, related_name="project_reminder_creator", on_delete=models.PROTECT)
    research_task = models.ForeignKey(
        'ResearchProjectTask', related_name="reminder_research_task", on_delete=models.CASCADE, blank=True, null=True
    )
    title = models.TextField(max_length=255, blank=False, null=False)
    description = models.TextField(null=True, blank=True)
    due_date = models.DateTimeField(null=False, blank=False)
    calendar_reminder = models.ForeignKey(
        'CalendarReminder', related_name="project_calendar_reminder", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def to_json(self, add_study=False):
        query_dict = dict()
        if add_study:
            query_dict['research_study'] = self.research_task.to_json()
        return dict(
            calendar_reminder=self.calendar_reminder.to_json(),
            research_task=self.research_task.to_json() if self.research_task else None,
            title=self.title,
            description=self.description,
            due_date=self.due_date,
            **query_dict
        )
