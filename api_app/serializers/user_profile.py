from abc import ABC

from django.contrib.auth.models import User
from django.db.models import QuerySet
from rest_framework import serializers

from auth_app.models import UserProfile, UserProfileQuestion


class UserProfileInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

    def to_representation(self, instance):
        return {
            'user': instance.get('user'),
            'username': instance.get('username'),
            'first_name': instance.get('first_name'),
            'last_name': instance.get('last_name'),
            'email': instance.get('email'),
            'is_active': instance.get('is_active'),
            'role': instance.get('role'),
            'role_value': instance.get('role_value'),
            'profile_picture': instance.get('profile_picture'),
            'experience': instance.get('experience'),
            'linkedin_link': instance.get('linkedin_link'),
            'twitter_link': instance.get('twitter_link'),
            'facebook_link': instance.get('facebook_link'),
            'instagram_link': instance.get('instagram_link'),
            'research_gate_link': instance.get('research_gate_link'),
            'custom_answers': instance.get('custom_answers'),
            'gender': instance.get('gender'),
            'city': instance.get('city'),
            'birthdate': instance.get('birthdate'),
            'household_salary': instance.get('household_salary'),
            'education_level': instance.get('education_level'),
            'research_interests': instance.get('research_interests'),
            'projects_lead': instance.get('projects_lead'),
            'projects_participating': instance.get('projects_participating'),
            'icu_city': instance.get('icu_city'),
            'bio': instance.get('bio'),
            'most_used_language': instance.get('most_used_language'),
            'contact_acknowledgements': instance.get('contact_acknowledgements'),
            'user_location': instance.get('user_location'),
            'active_projects': instance.get('active_projects'),
            'is_approved_researcher': instance.get('is_approved_researcher'),
            'is_anonymous': instance.get('is_anonymous'),
            'opt_out_project_invitations': instance.get('opt_out_project_invitations'),
        }


class CommunityListSerializer(serializers.BaseSerializer, ABC):
    def to_representation(self, instance):

        # if we have anonymous user don't send the user details instead just send following attributes
        if instance.get('is_anonymous'):
            return {
                'is_anonymous': instance.get('is_anonymous'),
                'role': 'Anonymous',
            }

        return {
            'user': instance.get('user'),
            'first_name': instance.get('first_name'),
            'last_name': instance.get('last_name'),
            'role': instance.get('role'),
            'bio': instance.get('bio'),
            'city': instance.get('city'),
            'research_interests': instance.get('research_interests'),
            'profile_link': instance.get('profile_link'),
            'profile_picture': instance.get('profile_picture'),
            'username': instance.get('username'),
            'pronouns': instance.get('pronouns'),
            'opt_out_project_invitations': instance.get('opt_out_project_invitations'),
        }


class EditUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)

    def validate_email(self, value):
        users_with_email = User.objects.filter(email__iexact=value)
        if users_with_email.exists():
            raise serializers.ValidationError("Duplicate email")

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'email']
        optional_fields = ['id', 'first_name', 'last_name', 'username', 'email']


class EditUserProfileSerializer(serializers.ModelSerializer):
    user = EditUserSerializer()

    class Meta:
        model = UserProfile
        fields = ['role', 'user_location', 'icu_institute', 'pronouns', 'user']
        optional_fields = ['role', 'user_location', 'icu_institute', 'pronouns', 'user']

    def update(self, validated_data, instance):
        if "user_profile" in validated_data:
            query_instance = UserProfile.objects.filter(user=instance.user)
            query_instance.update(**validated_data["user_profile"])
        if "user" in validated_data:
            user_query_instance = User.objects.filter(id=instance.user.id)
            user_query_instance.update(**validated_data["user"])
        return instance


class UserProfileQuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()
    label = serializers.SerializerMethodField()
    section_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfileQuestion
        fields = '__all__'

    def __init__(self, args, **kwargs):
        super().__init__(args, **kwargs)
        # TODO: Create a new to_json method for UserProfileQuestion that only returns these fields
        if isinstance(args, QuerySet):
            json_data = {}
            for question in args:
                json_data[question.id] = question.to_json()
            self.json_data = json_data
            self.is_query_set = True
        else:
            self.json_data = args.to_json()
            self.is_query_set = False

    def get_options(self, obj):
        return self.json_data['options'] if not self.is_query_set else self.json_data[obj.id]['options']

    def get_label(self, obj):
        return self.json_data['label'] if not self.is_query_set else self.json_data[obj.id]['label']

    def get_section_name(self, obj):
        return self.json_data['section_name'] if not self.is_query_set else self.json_data[obj.id]['section_name']
