from django.db import models, transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import MethodNotAllowed

from educate_app.models import Classroom, ClassroomParticipants

from api_app.serializers import SuccessSerializer, ErrorSerializer
from educate_app.serializers.classroom_builder import ClassroomBuilderSerializer

from educate_app.utils import ITEM_DOES_NOT_EXIST

class ClassroomBuilder(APIView):


    def get(self, request, classroom_id=None):
        """
            Get all the classroom data or specific classroom detail
        """

        # get all the classrooms id user is part of
        classroom_participant_id = ClassroomParticipants.objects.filter(user_id=request.user).values_list('classroom_id', flat=True)

        # add the query; if specific classroom id is provided then use that, else get all the users classrooms
        query_classroom = models.Q(id__in=[classroom_id] if classroom_id else classroom_participant_id)

        # classroom query
        classroom = Classroom.objects.filter(query_classroom)
        # TODO: show inactive to classroom creator?
        classroom_serializer = ClassroomBuilderSerializer(instance=classroom, many=True, context={'show_inactive': False})

        return Response(classroom_serializer.data, status=status.HTTP_200_OK, content_type="application/json")


    def post(self, request):
        """
        Post request to create a classroom
        """
        # send the request data to serializer
        classroom_serializer = ClassroomBuilderSerializer(data=request.data, context={'request_data': request.data.copy()})

        # if no errors found in the serializer create the instance for the Classroom
        if classroom_serializer.is_valid():
            classroom_serializer.save()
            # Access rejected users from the serializer's context
            rejected_users = classroom_serializer.context.get('rejected_users', [])
            classroom_data = classroom_serializer.data
            classroom_data['rejected_users'] = rejected_users
            return Response(
                SuccessSerializer(dict(success=classroom_data)).data, 
                status=status.HTTP_200_OK,
                content_type="application/json"
            )

        # if there is any error in serializer send that to the user
        if classroom_serializer.errors:
            return Response(
                ErrorSerializer(dict(error="Error creating classroom", form_errors=classroom_serializer.errors)).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )


    def patch(self, request, classroom_id=None):
        """
        Patch the specific classroom
        """
        if classroom_id is None:
            raise MethodNotAllowed("PATCH")

        # TODO: Write update code for research interests
        existing_classroom = Classroom.objects.filter(id=classroom_id)

        if existing_classroom.exists():
            request_data_copy = request.data.copy()
            existing_classroom_serializer = ClassroomBuilderSerializer(existing_classroom.first(), data=request_data_copy, partial=True)
            if existing_classroom_serializer.is_valid():
                existing_classroom_serializer.save()
                return Response(
                    SuccessSerializer(dict(success=existing_classroom_serializer.data)).data,
                    status=status.HTTP_200_OK,
                    content_type="application/json"
                )
            else:
                return Response(
                    ErrorSerializer(dict(error="Error updating classroom", form_errors=existing_classroom_serializer.errors)).data,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content_type="application/json"
                )
        else:
            return Response(
                ErrorSerializer(dict(error=ITEM_DOES_NOT_EXIST.format("classroom", "update"))).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )


    def delete(self, request, classroom_id=None):
        """Delete a classroom and its participants"""
        if classroom_id is None:
            raise MethodNotAllowed("DELETE")
        with transaction.atomic():
            try:
                classroom = Classroom.objects.get(id=classroom_id)
                classroom.delete()
                return Response(
                    SuccessSerializer(dict(success="Deleted Successfully")).data, 
                    status=status.HTTP_200_OK,
                    content_type="application/json"
                )
            except Exception as classroom_deletion_error:
                return Response(
                    ErrorSerializer(dict(error="Error deleting classroom")).data,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content_type="application/json"
                )
