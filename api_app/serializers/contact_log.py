from rest_framework import serializers
from auth_app.models import ContactLog


class AuthContactLogSerializer(serializers.ModelSerializer):
    """Serializer for admin to get all the system issues with all details of the user"""
    screenshot_base64 = serializers.SerializerMethodField()

    class Meta:
        model = ContactLog
        fields = '__all__'

    def get_screenshot_base64(self, obj):
        return obj.get_screenshot()


class ContactLogSerializer(serializers.ModelSerializer):
    """The serializer retrieves system issues along with specific user details."""
    screenshot_base64 = serializers.SerializerMethodField()

    class Meta:
        model = ContactLog
        exclude = ('first_name', 'last_name', 'email_address')

    def get_screenshot_base64(self, obj):
        return obj.get_screenshot()
