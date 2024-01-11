from rest_framework import serializers

from auth_app.models import UserProfileSection, UserProfileQuestion, ResearchInterest, ResearchInterestCategory


class SystemUserProfileQuestionSerializer(serializers.ModelSerializer):
    question_type = serializers.SerializerMethodField()
    section_name = serializers.SerializerMethodField()
    user_profile_section = serializers.SerializerMethodField()
    option_list = serializers.SerializerMethodField()
    research_interest_area = serializers.SerializerMethodField()
    parent_question_id = serializers.SerializerMethodField()
    parent_question_options = serializers.SerializerMethodField()

    class Meta:
        model = UserProfileQuestion
        fields = '__all__'

    def get_question_type(self, obj):
        return f'{obj.type}'.replace("_", " ").title()

    def get_section_name(self, obj):
        return f'{obj.section.name}'

    def get_user_profile_section(self, obj):
        return f'{obj.section.id}'

    def get_research_interest_area(self, obj):
        if obj.linked_to_research_interest:
            potential_interests = ResearchInterest.objects.filter(category=obj.research_interest_category)
            if potential_interests.exists():
                return potential_interests.first().type
        return ''

    def get_option_list(self, obj):
        option_list = getattr(obj, 'option_list', None)
        if option_list:
            from auth_app.models import UserProfileOption
            options = UserProfileOption.objects.filter(id__in=option_list).order_by('order_number')
            return [opt.to_json() for opt in options]
        return []

    def get_parent_question_id(self, obj):
        if obj.parent_question:
            return obj.parent_question.id

    def get_parent_question_options(self, obj):
        if obj.parent_question:
            dependency = obj.user_profile_dependant_question.get()
            return dict(value=dependency.option.id, label=dependency.option.title)
        return []


class UserProfileSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfileSection
        fields = '__all__'


class ResearchInterestCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchInterestCategory
        fields = "__all__"

    def create(self, validated_data):
        mapping = validated_data.get('mapping', None)
        if not mapping:
            title = validated_data.get('title', "")
            validated_data['mapping'] = title.replace(" ", "_").upper()
        return ResearchInterestCategory.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        mapping = validated_data.get('mapping', None)
        instance.mapping = validated_data.get('title', instance.title).replace(
            " ", "_"
        ).upper() if not mapping else mapping
        instance.save()
        return instance


class ResearchInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchInterest
        fields = "__all__"
