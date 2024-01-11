from rest_framework import serializers

from auth_app.models import UserProfile
from django.contrib.auth.models import User


class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active')

    def get_role(self, obj):
        profile = UserProfile.objects.get(user=obj)
        return profile.role
