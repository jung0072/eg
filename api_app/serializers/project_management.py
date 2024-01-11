from django.db.models import QuerySet
from rest_framework import serializers

from engage_app.models import ResearchProject, ResearchProjectTask
from communication_app.models import Message


class ProjectsManagementSerializer(serializers.ModelSerializer):
    team_size = serializers.SerializerMethodField()
    number_of_tasks = serializers.SerializerMethodField()
    creator_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ResearchProject
        fields = ("id", "reference_name", "creator_full_name", "contact_email", "review_date", "updated_at", "team_size", "number_of_tasks")
        
    def get_team_size(self, obj):
        return ResearchProject.get_team_size(obj)
    
    def get_number_of_tasks(self, obj):
        return ResearchProjectTask.objects.filter(research_project=obj.id).count()
    
    def get_creator_full_name(self, obj):
        return obj.creator.get_full_name()


class ChatLogsSerializer(serializers.ModelSerializer):

    class Meta:
        model = Message
        fields = ("sender_id", "content", "created_at", "picture_link", "discussion_board_id", "is_deleted")
