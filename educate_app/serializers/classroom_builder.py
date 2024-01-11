from rest_framework import serializers

from auth_app.models import ResearchInterest
from educate_app.models import Classroom, ClassroomParticipants

from educate_app.utils import dummy_user_list_data, validate_date_fields
from engage_app.utils import clean_estimated_dates


def update_fields(instance, validated_data, fields_to_update):
    for field in fields_to_update:
        setattr(instance, field, validated_data.get(field, getattr(instance, field)))


class ClassroomBuilderSerializer(serializers.ModelSerializer):
    classroom_participant = serializers.SerializerMethodField()
    research_interests = serializers.PrimaryKeyRelatedField(
        queryset=ResearchInterest.objects.all(),
        many=True,
        required=False
    )


    class Meta:
        model = Classroom
        fields = '__all__'


    # get additional fields
    def get_classroom_participant(self, obj):
        show_inactive = self.context.get('show_inactive')
        classroom_members = obj.get_classroom_members(show_inactive)
        classroom_members_serializer = ClassRoomParticipantSerializer(classroom_members, many=True).data
        return classroom_members_serializer

    # validate fields
    def validate(self, data):
        """
            Checks for start_date and end_date
        """
        # validate date fields first
        validate_date_fields(data['is_using_start_date'], data['start_date_type'], data['start_date'])
        validate_date_fields(data['is_using_end_date'], data['end_date_type'], data['end_date'])
        cleaned_date_data = clean_estimated_dates(data, 'is_using_start_date', 'start_date_type', 'start_date')
        cleaned_date_data = clean_estimated_dates(data, 'is_using_end_date', 'end_date_type', 'end_date')
        return cleaned_date_data


    def create(self, validated_data):
        # TODO: remove the dummy data once front end is implemented
        request_data = self.context.get('request_data')

        research_interests_data = validated_data.pop('research_interests', [])
        user_list_data = request_data.pop('user_list', [])

        classroom = Classroom.objects.create(**validated_data)

        # If research_interests_data exists, associate interests with the classroom
        if research_interests_data:
            classroom.research_interests.set(research_interests_data)

        #  if we have a user list data add participants
        if user_list_data:
            user_participant = classroom.add_user_to_classroom(classroom, user_list_data)
            rejected_users = user_participant.get('rejected_users', [])
            self.context['rejected_users'] = rejected_users
        return classroom


    def update(self, instance, validated_data):
        fields_to_update = [
            'title',
            'is_using_start_date',
            'start_date_type',
            'start_date',
            'is_using_end_date',
            'end_date_type',
            'end_date',
        ]

        update_fields(instance, validated_data, fields_to_update)

        instance.save()
        return instance


class ClassRoomParticipantSerializer(serializers.ModelSerializer):
    
    # we don't want to send the whole classroom data just send the id
    classroom = serializers.SerializerMethodField()

    # TODO: create a general User Serializer and attach the permission
    # according to the requested data
    class Meta:
        model = ClassroomParticipants
        fields = '__all__'
        depth = 1


    def get_classroom(self, obj):
        return obj.classroom_id


    def update(self, instance, validated_data):
        fields_to_update = [
            'is_active',
            'is_teacher_assistant',
            'is_instructor',
            'is_student',
        ]

        update_fields(instance, validated_data, fields_to_update)

        instance.save()
        return instance
