from django import forms

from engage_app.models import ResearchProjectTask
from engage_app.utils import UserRoles, DateTypes, clean_estimated_dates


class ResearchProjectTaskForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        self.task_creator_id = kwargs.pop('task_creator_id', None)
        self.research_project_id = kwargs.pop('research_project_id', None)
        super().__init__(*args, **kwargs)

    class Meta:
        model = ResearchProjectTask
        fields = [
            'title', 'description', 'survey_link', 'roles_needed', 'subject', 
            'hide_submitted_files', 'is_using_due_date', 'due_date_type', 'due_date',
        ]
        widgets = {
            'title': forms.TextInput(),
            'description': forms.TextInput(),
            'due_date': forms.DateInput(attrs={'type': 'date'}),
            'due_date_type': forms.RadioSelect(choices=DateTypes.to_list()),
            'roles_needed': forms.CheckboxSelectMultiple(choices=UserRoles.to_list()),
        }

    def clean(self):
        cleaned_data = super().clean()
        cleaned_data = clean_estimated_dates(cleaned_data, 'is_using_due_date', 'due_date_type', 'due_date')
        return cleaned_data

    def save(self, commit=True):
        research_task = super().save(commit=False)
        if commit:
            # Set the creator id and project id before created a new research task, this does not need to be
            # done when editing a research task
            if not self.instance.pk:
                research_task.task_creator_id = self.task_creator_id
                research_task.research_project_id = self.research_project_id
            research_task.save()
        return research_task
