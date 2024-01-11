from cities_light.models import City
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from email_app.utils import EngageEmail, EmailTemplateConstants
from config import settings
from datetime import datetime, timedelta
from rest_framework_simplejwt.tokens import AccessToken
from engage_app.utils import UserRoles

from auth_app.models import UserProfile
from auth_app.utils import PLATFORMS

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True, validators=[UniqueValidator(queryset=User.objects.all())])
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password2', 'first_name', 'last_name', 'is_active']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def create(self, validated_data):
        validated_data["is_active"] = False
        validated_data['password'] = make_password(validated_data['password'])
        validated_data.pop("password2")
        return User.objects.create(**validated_data)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password does not match."})

        return attrs


class UserProfileRegistrationSerializer(serializers.ModelSerializer):
    """
    UserProfile serializer to create the user profile
    """
    user = RegisterSerializer(required=True)

    class Meta:
        model = UserProfile
        fields = ['user', 'role']

    def create(self, validated_data):
        user_data = validated_data["user"]
        user_profile_data = validated_data["user_profile"]
        user_profile_data["has_logged_in"] = False
        platform = self.context.get('platform')

        if "username" in user_data:
            user_data["username"] = user_data['username'].lower()
        # by default setting educate users to researcher
        if platform == PLATFORMS.EDUCATE.value:
            user_profile_data['role'] = UserRoles.RESEARCHER.name

        user = RegisterSerializer.create(RegisterSerializer(), validated_data=user_data)
        user_profile = UserProfile.objects.update_or_create(user=user, role=user_profile_data["role"])

        access = AccessToken().for_user(user)
        access.set_exp(lifetime=timedelta(hours=1))
        access['email'] = user.email
        
        # create email_params
        email_subject = f'{platform} | {EmailTemplateConstants.SUBJECT_REGISTRATION_ACTIVATION.format(platform)}'
        email_template = EmailTemplateConstants.REGISTRATION_ACTIVATION

        if platform == PLATFORMS.EDUCATE.value:
            activation_url = 'activate_educate_user/'
            base_template = "base_template_educate.html"
        elif platform == PLATFORMS.ENGAGE.value:
            activation_url = 'activate_user/'
            base_template = "base_template_engage.html"
        email_params = {
            'email': user.email,
            'user': user,
            'button_link': f"{settings.SERVER_NAME}{activation_url}{access}/",
            'button_text': "Activate Account",
            'platform': platform,
            'base_template': base_template
        }

        email = EngageEmail(
            subject=email_subject,
            template_name=email_template,
            template_params=email_params
        )

        email.set_recipients(to=email_params["user"].email, cc=email_params['user'].email)
        email.send()

        return user_profile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'email']


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name']


class UserProfileSerializer(serializers.ModelSerializer):
    """Get the User Profile information using this serializer"""

    def to_representation(self, instance):
        return {
            'id': instance.get('id'),
            'is_admin': instance.get('is_admin'),
            'full_name': instance.get('full_name'),
            'is_researcher': instance.get('is_researcher'),
            'profile_picture': instance.get('profile_picture'),
            'project_list': instance.get('project_list'),
            'completed_project_list': instance.get('completed_project_list'),
            'recent_messages': instance.get('recent_messages'),
            'task_list': instance.get('task_list'),
            'active_view': instance.get('active_view'),
            'gender': instance.get('gender'),
            'sexual_orientation': instance.get('sexual_orientation'),
            'population_group': instance.get('population_group'),
            'most_used_language': instance.get('most_used_language'),
            'is_visible_minority': instance.get('is_visible_minority'),
            'is_identified_native': instance.get('is_identified_native'),
            'has_disability': instance.get('has_disability'),
            'first_language': instance.get('first_language'),
            'edi_answers_public': instance.get('edi_answers_public'),
            'role': instance.get('role'),
            'date_of_birth': instance.get('date_of_birth'),
            'first_name': instance.get("first_name"),
            'last_name': instance.get("last_name"),
            'custom_answers': instance.get("custom_answers"),
            'username': instance.get("username"),
            'email': instance.get("email"),
            'user_location': instance.get("user_location"),
            'icu_location': instance.get("icu_location"),
            'icu_institute': instance.get("icu_institute"),
            'pronouns': instance.get("pronouns"),
            'is_profile_complete': instance.get("is_profile_complete"),
            'is_anonymous': instance.get("is_anonymous"),
            'opt_out_project_invitations': instance.get("opt_out_project_invitations"),
            'active_projects': instance.get('active_projects'),
        }


class PendingResearcherSerializer(serializers.ModelSerializer):
    """Get the pending researchers information using this serializer"""

    def to_representation(self, instance):
        return {
            'pending_researchers': instance.get('pending_researchers')
        }

