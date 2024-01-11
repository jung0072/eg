from rest_framework import serializers
from communication_app.models import SystemMessage

class SystemMessageSerializer(serializers.ModelSerializer):

    class Meta:
        model=SystemMessage
        fields = '__all__'
