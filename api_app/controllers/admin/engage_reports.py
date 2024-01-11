from django.contrib.auth.models import User

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from engage_app.models import EngageReports

from api_app.utils.permissions import RequireAdmin
from api_app.serializers import EngageReportsSerializer, SuccessSerializer, ErrorSerializer
from api_app.utils.errorcodes import *


class EngageReportController(APIView):


    def get_permission_classes(self):
        if self.request.method == 'POST':
            return [IsAuthenticated]
        elif self.request.method == 'PATCH' or self.request.method == 'GET':
            return [IsAuthenticated, RequireAdmin]


    def post(self, request):
        # create the serialized data for serializer
        serializer_data = {
            'reporter': request.user.id,
            'user_comment': request.data.get('user_comment'),
            'report_type': request.data.get('report_type'),
            'object_id': request.data.get('object_id'),
        }

        engage_reports_serializer = EngageReportsSerializer(data=serializer_data)

        if engage_reports_serializer.is_valid():
            # if it is valid save the instance
            engage_reports_serializer.save()
            return Response(
                SuccessSerializer(dict(success=issue_reported_success)).data, 
                status=status.HTTP_200_OK,
                content_type="application/json"
            )
        if engage_reports_serializer.errors:
            return Response(
                ErrorSerializer(dict(error="Error submitting report", form_errors=engage_reports_serializer.errors)).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )


    def patch(self, request, report_id):
        try:
            engage_report = EngageReports.objects.get(id=report_id)
        except EngageReports.DoesNotExist:
            return Response(
                ErrorSerializer(dict(error="Report that you are trying to modify does not exist")).data,
                status=status.HTTP_404_NOT_FOUND,
                content_type="application/json"
            )

        # Update the engage_report with the data
        is_resolved = request.data.get('is_resolved')
        admin_comments = request.data.get('admin_comments')

        if is_resolved is not None:
            engage_report.is_resolved = is_resolved

        if 'admin_comments' in request.data:
            engage_report.admin_comments = admin_comments

        # Save the updated data
        engage_report.save()

        return Response(
            SuccessSerializer(dict(success=f"Successfully updated report with ID: {engage_report.id}.")).data,
            status=status.HTTP_200_OK,
            content_type="application/json"
        )


    def get(self, request):
        engage_reports = EngageReports.objects.all()
        
        engage_report_serializer = EngageReportsSerializer(instance=engage_reports, many=True)

        return Response(engage_report_serializer.data, status=status.HTTP_200_OK, content_type="application/json")
