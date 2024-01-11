import re
from django.db import models
from aws_s3_provider.S3Service import S3Service
from config import settings

from engage_app.utils import EngageFileCategory, create_alphanumeric_code
from engage_app.validators import validate_file_extension
from auth_app.models import UserProfile
from django.http import HttpResponse


class ResearchProjectTaskFile(models.Model):
    # Define fields to store the parent task of the research file and who uploaded the file
    parent_task = models.ForeignKey(
        'engage_app.ResearchProjectTask', related_name='%(app_label)s_%(class)s_parent_task', on_delete=models.CASCADE
    )
    uploader = models.ForeignKey(
        'auth_app.UserProfile', on_delete=models.CASCADE, related_name='%(app_label)s_%(class)s_uploader'
    )

    # main task files (protocol files) will be available to download by project team members and are meant to be
    # resubmitted to the task by each user
    is_protocol_file = models.BooleanField(default=False)
    title = models.CharField(max_length=200)
    file = models.FileField(blank=True, null=True, upload_to='tmp', validators=[validate_file_extension])
    created_at = models.DateTimeField(auto_now_add=True)
    url = models.URLField(null=True, blank=True, max_length=2083)

    def to_json(self):
        uploader = UserProfile.objects.get(user_id=self.uploader_id)

        # attach on the file, if it is an url then we just need to send the url otherwise we send the file
        update_json_dict = dict(url=self.url) if self.url else dict(file_type=self.get_file_type)
        return dict(
            research_project_id=self.parent_task.research_project_id,
            task_id=self.parent_task.id,
            is_protocol_file=self.is_protocol_file,
            uploader_id=self.uploader.user_id,
            uploader_name=uploader.user.get_full_name(),
            title=self.title,
            created_at=str(self.created_at),
            file_id=self.id,
            **update_json_dict
        )

    def get_task_owner(self):
        return self.parent_task.task_creator

    def get_uploader_name(self):
        return self.uploader.user.get_full_name()

    @classmethod
    def upload_file_to_aws(cls, task_id, file_name, file):
        S3Service(settings.AWS_S3_BUCKET).upload_file(
            file_key=f'{EngageFileCategory.TASK.name}/{task_id}/{file_name}',
            file_obj=file
        )

    @property
    def get_file_key(self):
        return f'{EngageFileCategory.TASK.name}/{self.parent_task.id}/{self.title}'

    @property
    def get_file_type(self):
        """based on the file extension, return the type of file: Image or Document"""
        file_extension = self.get_file_extension(self.title)
        image_file_list = [
            '.tif', '.tiff', '.bmp', '.jpg', '.jpeg', '.gif', '.png', '.eps'
        ]

        if file_extension in image_file_list:
            return 'Image'
        return 'Document'

    def delete_file(self):
        S3Service(settings.AWS_S3_BUCKET).delete_file(self.get_file_key)

    def rename_file(self, old_key):
        S3Service(settings.AWS_S3_BUCKET).rename_file(old_key, self.get_file_key)

    def download_file(self):
        # get the file metadata from aws
        file_metadata = S3Service(settings.AWS_S3_BUCKET).get_file(file_key=self.get_file_key)

        # build the content response by using the file metadata and return the file as an http response
        content_type = file_metadata.get('ContentType')
        response = HttpResponse(file_metadata.get('content'), content_type=content_type)
        response['Content-Length'] = file_metadata.get('ContentLength')
        response['Content-Disposition'] = 'attachment; filename=%s' % self.title
        return response

    @classmethod
    def format_file_name(cls, task_id, uploader_id, file) -> str:
        """Format the file name for upload to aws, remove all spaces and replace with underscores, add a randomized
        alphanumeric code at the end of the file name along with the task id and uploader id."""
        # first find the file extension and then rejoin the str with replaced spaces and a randomized integer
        file_extension = cls.get_file_extension(file.name)
        file_prefix = f"{file.name.replace(file_extension, '').replace(' ', '_')}_{create_alphanumeric_code(8)}"
        file_suffix = f"{task_id}_{uploader_id}{file_extension}"
        return f"{file_prefix}{file_suffix}"

    @classmethod
    def get_file_extension(cls, file_name):
        """Return the file extension from the specified file name"""
        return re.search(r'\.[0-9a-zA-Z]+$', file_name).group()

    @staticmethod
    def build_submitted_or_protocol_file_list(file_list: models.query.QuerySet, file_type: str):
        """
        Build a list of JSON representations of files based on their type and protocol status.

        Args:
            file_list (models.query.QuerySet): A QuerySet containing files to be processed.
            file_type (str): The type of files to select. Should be either 'TASK_FILE' or 'SUBMITTED_FILE'.

        Returns:
            list: A list of JSON representations of selected files based on the specified criteria.

        This function iterates through the provided QuerySet of files and selects files based on their type
        and whether they are protocol files or not. It then converts the selected files to JSON representations
        and returns them in a list.
        """
        # Initialize an empty list to store JSON representations of the selected files.
        file_list_json = []

        # Iterate through the files in the provided QuerySet.
        for file in file_list:
            # Check the file type specified (either 'TASK_FILE' or 'SUBMITTED_FILE') and
            # whether the current file is a protocol file or not.
            if file_type == 'TASK_FILE' and file.is_protocol_file:
                # If the file type is 'TASK_FILE' and the current file is a protocol file,
                # add its JSON representation to the list.
                file_list_json.append(file.to_json())
            elif file_type == 'SUBMITTED_FILE' and not file.is_protocol_file:
                # If the file type is 'SUBMITTED_FILE' and the current file is not a protocol file,
                # add its JSON representation to the list.
                file_list_json.append(file.to_json())

        # Return the list containing JSON representations of the selected files.
        return file_list_json
