from django.contrib.contenttypes.models import ContentType
from django.shortcuts import reverse

from rest_framework import serializers

from engage_app.models import EngageReports, ResearchProject, ResearchProjectTask, \
    ResearchProjectTaskFile
from auth_app.models import UserProfile
from engage_app.utils import EngageReportTypes
from communication_app.models import Message
from api_app.utils import create_reported_message_instance


# TODO: Add permission and throttle classes
# mapping between report types and associated models
REPORT_TYPE_TO_MODEL = {
    EngageReportTypes.PROJECT.name: ResearchProject,
    EngageReportTypes.TASK.name: ResearchProjectTask,
    EngageReportTypes.USER.name: UserProfile,
    EngageReportTypes.MESSAGE.name: Message,
    EngageReportTypes.FILE.name: ResearchProjectTaskFile,
}


class EngageReportsSerializer(serializers.ModelSerializer):

    class Meta:
        model = EngageReports
        fields = ['id', 'reporter', 'user_comment', 'object_id', 'report_type']


    def create(self, validated_data):
        # Extract the necessary data from the validated data
        report_type = validated_data.get('report_type', None)
        object_id = validated_data.get('object_id', None)

        # Check if the required fields are present
        if report_type is None or object_id is None:
            raise serializers.ValidationError("Missing fields")

        # Get the associated model based on the report_type
        associated_model = None
        associated_model = REPORT_TYPE_TO_MODEL.get(report_type)
        # Add more conditions for other report types if needed

        if associated_model is None:
            raise serializers.ValidationError("Invalid report_type provided.")

        # Check if the object with the given object_id exists for the associated model
        try:
            associated_object = associated_model.objects.get(pk=object_id)
        except associated_model.DoesNotExist:
            raise serializers.ValidationError("The associated object does not exist.")

        # set the content type based on the associated model if the object exist
        validated_data['content_type'] = ContentType.objects.get_for_model(associated_model)
        # Create the EngageReports instance
        engage_report = EngageReports.objects.create(**validated_data)

        return engage_report


    def to_representation(self, instance):

        # Get content type and object id for dynamic field
        content_type = instance.content_type
        object_id = instance.object_id

        # by using reported instance field of the EngageReports model we can have the queryset of dynamic model
        reported_item_instance = instance.reported_instance

        message_instance = {}
        file_instance = {}
        # serialize the user data
        reporter_data={
            'user_id': instance.reporter.id,
            'username': instance.reporter.username, 
            'first_name': instance.reporter.first_name, 
            'last_name': instance.reporter.last_name, 
            'email': instance.reporter.email,
            'profile_link': reverse('auth_app:react_user_profile', args=[instance.reporter.id]),
        }

        # serialize data for report
        reports_data = {
            'key': instance.id,
            'reporter': reporter_data,
            'report_type': instance.report_type,
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
            'is_resolved': instance.is_resolved,
            'user_comment': instance.user_comment,
            'admin_comments': instance.admin_comments,
        }

        if content_type.model == 'researchprojecttaskfile':
            file_instance = {
                'file_name': reported_item_instance.title,
                'task_link': reverse('auth_app:react_project_task_details', kwargs={'research_project_task_id': reported_item_instance.parent_task_id}),
            }
        # if the model is message, we create the message instance
        if content_type.model == 'message':
            message_instance = create_reported_message_instance(reported_item_instance)

        # Define a mapping of content types to their respective link generators, or item
        content_type_links = {
            'researchproject': lambda obj_id: reverse('auth_app:react_project_details', args=[obj_id]),
            'researchprojecttask': lambda obj_id: reverse('auth_app:react_project_task_details', kwargs={'research_project_task_id': obj_id}),
            'userprofile': lambda obj_id: reverse('auth_app:react_user_profile', args=[obj_id]),
            'message': lambda obj_id: message_instance,
            'researchprojecttaskfile': lambda obj_id: file_instance,
        }

        # Get the item or link generator based on content type
        item_or_link_generator = content_type_links.get(content_type.model, None)

        if item_or_link_generator:
            # Generate the reported item link
            reports_data['reported_item'] = item_or_link_generator(object_id)

        return reports_data
