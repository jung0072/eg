from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from educate_app.models import ClassroomParticipants, Classroom

from educate_app.serializers.classroom_builder import ClassRoomParticipantSerializer
from api_app.serializers import SuccessSerializer, ErrorSerializer

from educate_app.utils import dummy_user_list_data, ITEM_DOES_NOT_EXIST


class ClassroomUserManagement(APIView):


    def get(self, request, classroom_id=None):
        """
            Get request to get all classrooms participants
        """

        classroom_participants = ClassroomParticipants.objects.filter(classroom_id=classroom_id, is_active=True)

        if classroom_participants.exists():
            classroom_participants_serializer = ClassRoomParticipantSerializer(classroom_participants, many=True)
            return Response(
                classroom_participants_serializer.data,
                status=status.HTTP_200_OK, content_type="application/json"
            )
        else:
            return Response(
                ErrorSerializer(dict(error="Classroom not found")).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )


    def post(self, request, classroom_id=None):
        """
            Post request to add a new user to the classroom
        """

        classroom = Classroom.objects.filter(id=classroom_id)
        user_list = request.data.get('user_list')
        # TODO: remove this dummy data after frontend development

        if classroom.exists():
            user_participant = classroom.first().add_user_to_classroom(classroom.first(), user_list)
            rejected_participants = user_participant['rejected_users']
            if rejected_participants:
                return Response(
                    ErrorSerializer(dict(error=user_participant)).data,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content_type="application/json"
                )
            else: 
                return Response(
                    SuccessSerializer(dict(success="Added team member(s) successfully")).data,
                    status=status.HTTP_200_OK,
                    content_type="application/json"
                )
        else:
            return Response(
                ErrorSerializer(dict(error="Classroom not found")).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )


    def patch(self, request, classroom_id=None, user_id=None):
        """
            Patch request to activate/deactivate or change a role for a user in classroom
        """
        request_data_copy = request.data.copy()
        classroom_participant = ClassroomParticipants.objects.filter(classroom_id=classroom_id, user_id=user_id)
        if classroom_participant.exists():
            classroom_participant_serializer = ClassRoomParticipantSerializer(classroom_participant.first(), data=request_data_copy)
            if classroom_participant_serializer.is_valid():
                classroom_participant_serializer.save()
                return Response(
                    SuccessSerializer(dict(success="Updated successfully")).data,
                    status=status.HTTP_200_OK,
                    content_type="application/json"
                )
            else:
                return Response(
                    ErrorSerializer(dict(error="Error updating user detail")).data,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content_type="application/json"
                )
        else:
            return Response(
                ErrorSerializer(dict(error=ITEM_DOES_NOT_EXIST.format("user", "update"))).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )
