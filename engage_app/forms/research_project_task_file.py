import os

from django import forms
from django.shortcuts import reverse
from engage_app.models import ResearchProjectTaskFile, ResearchProjectParticipant
from engage_app.utils import VALID_FILE_TYPES
from communication_app.models import Notification
from communication_app.utils import NotificationTypes


class ResearchProjectTaskFileForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        self.uploader_id = kwargs.pop('uploader_id', None)
        self.research_project_task_id = kwargs.pop('research_project_task_id', None)
        super().__init__(*args, **kwargs)

    class Meta:
        model = ResearchProjectTaskFile
        fields = ['file', 'is_protocol_file']
        widgets = {
            'file': forms.ClearableFileInput(attrs={'data-field-name': 'File', 'accept': ','.join(VALID_FILE_TYPES)}),
            'is_protocol_file': forms.HiddenInput(),
        }

    def save(self, commit=True):
        research_file = super().save(commit=False)
        if commit:
            return create_research_task_file(research_file, self.research_project_task_id, self.uploader_id)


class ResearchProjectTaskCloudDocumentForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        self.uploader_id = kwargs.pop('uploader_id', None)
        self.research_project_task_id = kwargs.pop('research_project_task_id', None)
        super().__init__(*args, **kwargs)

    class Meta:
        model = ResearchProjectTaskFile
        fields = ['title', 'url', 'is_protocol_file']

    def save(self, commit=True):
        research_file = super().save(commit=False)
        if commit:
            research_file.parent_task_id = self.research_project_task_id
            research_file.uploader_id = self.uploader_id
            research_file = research_file.save()
            return research_file


def create_research_task_file(research_file, research_project_task_id, uploader_id):
    # Set the creator id and project id before saving the research task
    research_file.parent_task_id = research_project_task_id
    research_file.uploader_id = uploader_id
    research_file.title = ResearchProjectTaskFile.format_file_name(
        file=research_file.file, task_id=research_file.parent_task_id, uploader_id=research_file.uploader_id
    )
    research_file.save()

    # Upload the file to AWS S3
    ResearchProjectTaskFile.upload_file_to_aws(
        task_id=research_project_task_id, file_name=research_file.title,
        file=research_file.file
    )

    # Delete the file from the instance
    uploaded_file_path = os.path.join(os.getcwd(), research_file.file.name)
    if os.path.isfile(uploaded_file_path):
        os.remove(uploaded_file_path)

    # Send out a notification to all of the team members besides the task owner saying a protocol file has
    # has been uploaded to this files parent task
    if not research_file.is_protocol_file:
        lead_research_team = research_file.parent_task.research_project.get_lead_research_team()
        for researcher in lead_research_team:
            notification = Notification.objects.create(
                receiver=researcher.user,
                source_id=research_file.parent_task.research_project_id,
                content=f'{research_file.parent_task.research_project.title}: New file submitted \'{research_file.title}\'',
                link=reverse('auth_app:react_project_task_details', args=[research_file.parent_task_id]),
                type=NotificationTypes.PROJECT.value
            )
            notification.save()

    # Send out a notification to the task owner and all of the lead researchers and project creator saying a
    # file was upload
    if research_file.is_protocol_file:
        study_team = ResearchProjectParticipant.objects.filter(
            study=research_file.parent_task.research_project, is_active=True
        ).exclude(user_id=uploader_id)

        for member in study_team:
            notification = Notification.objects.create(
                receiver=member.user,
                source_id=research_file.parent_task.research_project_id,
                content=f'{research_file.parent_task.research_project.title}: New Protocol File uploaded: \'{research_file.title}\'',
                link=reverse('auth_app:react_project_task_details', args=[research_file.parent_task_id]),
                type=NotificationTypes.PROJECT.value
            )
            notification.save()

    return research_file
