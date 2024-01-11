from rest_framework import serializers

from auth_app.models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    """
    UserProfile serializer to add user edi information
    """

    class Meta:
        model = UserProfile
        fields = '__all__'

