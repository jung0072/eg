from rest_framework import serializers

from auth_app.models.faq import FAQ
from auth_app.views.serializers.user_serializer import UserSerializer


class FAQSerializer(serializers.ModelSerializer):
    submitter = UserSerializer(read_only=True)

    class Meta:
        model = FAQ
        fields = '__all__'
        read_only_fields = ['viewed_users', 'liked_users']

    def create(self, validated_data):
        user = self.context['request'].user
        if not user.is_staff and not user.is_superuser:
            raise serializers.ValidationError("Only admins have access to create the FAQs.")
        faq = FAQ.objects.create(**validated_data)
        return faq
