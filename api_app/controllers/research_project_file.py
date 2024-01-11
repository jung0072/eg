import json

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FileUploadParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api_app.serializers import ErrorSerializer, SuccessSerializer
from api_app.utils.common import is_string_an_url
from api_app.utils.permissions import RequireProjectTaskAssigned, IsProjectNotArchived
from engage_app.forms import ResearchProjectTaskFileForm, ResearchProjectTaskCloudDocumentForm
from engage_app.models import ResearchProjectTaskFile, ResearchProjectParticipant


class ResearchProjectFileController(APIView):
    permission_classes = [IsAuthenticated, IsProjectNotArchived]

    def delete(self, request, file_id, file_type, project_id=None, task_id=None):
        # Validate that the file we are trying to delete does exist
        file = ResearchProjectTaskFile.objects.get(id=file_id)
        parent = file.parent_task

        # If the file is a cloud document (has a url) then we can just run the django model delete method
        if file.url:
            file.delete_file()
        file.delete()
        uploaded_files = ResearchProjectTaskFile.objects.filter(parent_task=parent)
        res = ResearchProjectTaskFile.build_submitted_or_protocol_file_list(uploaded_files, file_type)
        return Response(
            data=res,
            content_type="application/json", status=status.HTTP_200_OK
        )

    def put(self, request, file_id, file_type, project_id=None, task_id=None):
        if not request.body:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        # Load the request body as json and validate if the file exists by querying the database for it
        data = json.loads(request.body)
        file = ResearchProjectTaskFile.objects.get(id=file_id)

        # First check to see if we are updating the title or a url (or both)
        updated_prop_dict = dict()
        if 'updated_title' in data:
            # Now check to see if we are dealing with a cloud document or not and prepare the title properly
            updated_prop_dict['title'] = data['updated_title']

            if not file.url:
                file_extension = file.title.split('.')[-1]
                updated_prop_dict['title'] += '.' + file_extension
        if 'updated_url' in data:
            # Make sure the url is a proper url before setting in the backend
            if is_string_an_url(data['updated_url']):
                updated_prop_dict['url'] = data['updated_url']

        # Checking if the file with the same title exist for the parent task
        if ResearchProjectTaskFile.objects.filter(parent_task=file.parent_task, **updated_prop_dict).exists():
            return Response(
                data='There already is a file with that name or url. Try again with a unique one',
                status=status.HTTP_400_BAD_REQUEST
            )

        # save the old file name as a reference and then update the file name in the database and save
        old_file_key = file.get_file_key

        if 'url' in updated_prop_dict:
            file.url = updated_prop_dict['url']
        if 'title' in updated_prop_dict:
            file.title = updated_prop_dict['title']
        file.save()

        # Check if we are updating a cloud document or a regular file, if it's a regular file it needs to be renamed
        # on AWS S3
        if not file.url and old_file_key != file.get_file_key:
            file.rename_file(old_file_key)

        uploaded_files = ResearchProjectTaskFile.objects.filter(parent_task=file.parent_task)
        result = ResearchProjectTaskFile.build_submitted_or_protocol_file_list(uploaded_files, file_type)

        return Response(
            data=result,
            content_type="application/json", status=status.HTTP_200_OK
        )


class ResearchTaskFileController(APIView):
    permission_classes = [IsAuthenticated, RequireProjectTaskAssigned, IsProjectNotArchived]
    parser_classes = [FileUploadParser]

    def post(self, request, project_id, task_id, file_type="protocol"):
        # Get the research file from the task and check if we are uploading a protocol file or a user file submission
        research_file = request.FILES.get('file', None)
        request.data['is_protocol_file'] = file_type == "protocol"

        error_list = []
        # After validating the research file submitted uses django build in form check we can create the research
        # task file using the direct file uploaded
        if research_file:
            task_file_form = ResearchProjectTaskFileForm(
                request.data, request.FILES, uploader_id=request.user.id,
                research_project_task_id=task_id
            )
            if task_file_form.is_valid():
                task_file_form.save()
                return Response(
                    content_type="application/json",
                    data=SuccessSerializer(dict(success="You have successfully uploaded your file!")).data,
                    status=status.HTTP_200_OK
                )
            error_list = task_file_form.errors
        return Response(
            content_type="application/json",
            data=ErrorSerializer(dict(error="Could not upload file to the task", form_errors=error_list)).data,
            status=status.HTTP_400_BAD_REQUEST
        )

    def get(self, request, project_id, task_id, file_id):
        # if the file exists, download the file from aws and return it to the user
        research_file = get_object_or_404(ResearchProjectTaskFile, id=file_id)
        permissions = ResearchProjectParticipant.objects.get(
            user_id=request.user.id, study_id=research_file.parent_task.research_project.id
        )

        # TODO: confirm with clients if we are allowing all users apart of the project to download submitted and protocol files
        if permissions.is_active:
            return research_file.download_file()
        return Response(
            status=status.HTTP_404_NOT_FOUND,
            data=ErrorSerializer(dict(error="Could not find the requested file")).data,
            content_type="applications/json"
        )


class ResearchTaskCloudDocumentController(APIView):
    permission_classes = [IsAuthenticated, RequireProjectTaskAssigned, IsProjectNotArchived]

    def post(self, request, project_id, task_id, file_type="protocol"):
        title = request.data.get('title', None)
        url = request.data.get('url', None)
        error_list = []

        # First validate if we have the url and the title for the cloud document
        if url and title:
            # Set the status of the protocol file and then instantiate the cloud file form
            request.data['is_protocol_file'] = file_type == "protocol"
            cloud_file_form = ResearchProjectTaskCloudDocumentForm(
                request.data, uploader_id=request.user.id, research_project_task_id=task_id
            )
            if cloud_file_form.is_valid():
                # Save the file form and return the success response to the user
                cloud_file_form.save()
                return Response(
                    content_type="application/json",
                    data=SuccessSerializer(dict(success="You have successfully uploaded your file!")).data,
                    status=status.HTTP_200_OK
                )
            error_list = cloud_file_form.errors
        return Response(
            content_type="application/json",
            data=ErrorSerializer(dict(error="Could not upload the cloud document to the task", form_errors=error_list)).data,
            status=status.HTTP_400_BAD_REQUEST
        )
