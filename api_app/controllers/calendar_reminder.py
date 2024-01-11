from rest_framework.permissions import IsAuthenticated
from rest_framework.status import HTTP_200_OK
from rest_framework.views import APIView

from api_app.serializers import DataSerializer
from engage_app.models import CalendarReminder
from rest_framework.response import Response


class CalendarReminderController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reminder_types = CalendarReminder.objects.all()
        serialized_types = [reminder_type.to_json() for reminder_type in reminder_types]
        return Response(data=serialized_types, status=HTTP_200_OK, content_type="application/json")
