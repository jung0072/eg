from rest_framework import serializers
from auth_app.models.admin_settings import AdminSettings

class SystemSettingsSerializer(serializers.ModelSerializer):

    class Meta:
        model = AdminSettings
        fields = '__all__'
