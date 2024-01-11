from django.db.models import QuerySet
from rest_framework import serializers

from engage_app.models import ResearchProject, ResearchProjectTaskAssignedUser, ResearchProjectCalendarReminder, ResearchProjectTask


class ResearchProjectSerializer(serializers.ModelSerializer):
    # TODO: create these fields in the research project model (also contact as a user)
    creator_name = serializers.SerializerMethodField()
    institutions = serializers.SerializerMethodField()
    tasks = serializers.SerializerMethodField()
    study_team = serializers.SerializerMethodField()
    user_permissions = serializers.SerializerMethodField()
    main_contact_profile = serializers.SerializerMethodField()
    custom_answers = serializers.SerializerMethodField()
    due_status = serializers.SerializerMethodField()
    displayed_research_interests = serializers.SerializerMethodField()
    contact_name = serializers.SerializerMethodField()
    alternate_lead = serializers.SerializerMethodField()
    alternate_lead_name = serializers.SerializerMethodField()
    project_leads = serializers.SerializerMethodField()
    discussion_board = serializers.SerializerMethodField()

    def __init__(self, args, **kwargs):
        # If we were supplied a current user id, we can get a reference to their project permissions and tasks
        extra_args_dict = dict()
        if "current_user" in kwargs:
            self.current_user = kwargs.pop('current_user')
            extra_args_dict['user_id'] = self.current_user
        super().__init__(args, **kwargs)
        if isinstance(args, QuerySet):
            json_data = {}
            for project in args:
                json_data[project.id] = project.to_json(add_tasks=True, **extra_args_dict)
            self.json_data = json_data
            self.is_query_set = True
        else:
            self.json_data = args.to_json(add_tasks=True, **extra_args_dict)
            self.is_query_set = False

    # TODO: write backend to get and set institutions
    def get_institutions(self, obj):
        return ["Not set", "Not Set", "Not set"]

    def get_tasks(self, obj):
        return self.json_data['tasks'] if not self.is_query_set else self.json_data[obj.id]['tasks']

    def get_study_team(self, obj):
        return self.json_data['study_team'] if not self.is_query_set else self.json_data[obj.id]['study_team']

    def get_user_permissions(self, obj):
        if self.is_query_set:
            return self.json_data[obj.id]['user_permissions'] if 'user_permissions' in self.json_data else ''
        return self.json_data['user_permissions'] if 'user_permissions' in self.json_data else ''

    def get_main_contact_profile(self, obj):
        return self.json_data['main_contact'] if not self.is_query_set else self.json_data[obj.id]['main_contact']

    def get_creator_name(self, obj):
        return self.json_data['creator'] if not self.is_query_set else self.json_data[obj.id]['creator']

    def get_custom_answers(self, obj):
        return self.json_data['custom_answers'] if not self.is_query_set else self.json_data[obj.id]['custom_answers']

    def get_due_status(self, obj):
        return self.json_data['due_status'] if not self.is_query_set else self.json_data[obj.id]['due_status']

    def get_displayed_research_interests(self, obj):
        return self.json_data['research_interests'] if not self.is_query_set else self.json_data[obj.id][
            'research_interests']

    def get_contact_name(self, obj):
        return self.json_data['main_contact']['name'] if not self.is_query_set else \
            self.json_data[obj.id]['main_contact']['name']

    def get_alternate_lead_name(self, obj):
        return self.json_data['alternate_lead_name'] if not self.is_query_set else self.json_data[obj.id][
            'alternate_lead_name']

    def get_alternate_lead(self, obj):
        return self.json_data['alternate_lead'] if not self.is_query_set else self.json_data[obj.id]['alternate_lead']

    def get_project_leads(self, obj):
        return self.json_data['project_leads'] if not self.is_query_set else self.json_data[obj.id]['project_leads']

    def get_discussion_board(self, obj):
        if not self.is_query_set:
            return self.json_data['discussion_board'] if 'discussion_board' in self.json_data else None
        else:
            return self.json_data[obj.id]['discussion_board'] if 'discussion_board' in self.json_data[obj.id] else None

    class Meta:
        model = ResearchProject
        fields = '__all__'


class ResearchTaskSerializer(serializers.BaseSerializer):

    def to_representation(self, instance):
        return {
            'task': instance.get('task'),
            'is_task_owner': instance.get('is_task_owner'),
            'task_creator': instance.get('task_creator'),
            'project_lead': instance.get('project_lead'),
            'roles_required': instance.get('roles_required'),
            'members': instance.get('members'),
            'uploaded_files': instance.get('uploaded_files'),
            'submitted_files': instance.get('submitted_files'),
            'is_assigned': instance.get('is_assigned'),
            'current_assigned_user_data': instance.get('current_assigned_user_data'),
            'user_permissions': instance.get('user_permissions')
        }


class ResearchProjectTaskAssignedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchProjectTaskAssignedUser
        fields = '__all__'


class ResearchProjectTableSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return {
            'id': instance.get('id'),
            'reference_name': instance.get('reference_name'),
            'project_leads': instance.get('project_leads'),
            'start_date': instance.get('start_date'),
            'end_date': instance.get('end_date'),
            'recruiting_status': instance.get('recruiting_status'),
            'title': instance.get('title'),
            'tasks': instance.get('tasks'),
            'end_date_type': instance.get('end_date_type'),
            'start_date_type': instance.get('start_date_type'),
            'is_using_start_date': instance.get('is_using_start_date'),
            'is_using_end_date': instance.get('is_using_end_date'),
            'is_approved': instance.get('is_approved'),
            'is_ready_for_review': instance.get('is_ready_for_review'),
            'is_complete': instance.get('is_complete'),
            'submission_status': instance.get('submission_status'),
            'permissions': instance.get('permissions'),
            'is_public': instance.get('is_public'),
            'is_archived': instance.get('is_archived'),
        }


class UserResearchProjectInfoSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return {
            'id': instance.get('id'),
            'creator': instance.get('creator'),
            'creator_id': instance.get('creator_id'),
            'is_approved': instance.get('is_approved'),
            'title': instance.get('title'),
            'reference_name': instance.get('reference_name'),
            'description': instance.get('description'),
            'icu_city': instance.get('icu_city'),
            'icu_country': instance.get('icu_country'),
            'partner_commitment_description': instance.get('partner_commitment_description'),
            'roles_needed': instance.get('roles_needed'),
            'start_date': instance.get('start_date'),
            'start_date_type': instance.get('start_date_type'),
            'is_using_start_date': instance.get('is_using_start_date'),
            'end_date': instance.get('end_date'),
            'end_date_type': instance.get('end_date_type'),
            'is_using_end_date': instance.get('is_using_end_date'),
            'created_at': instance.get('created_at'),
            'updated_at': instance.get('updated_at'),
            'study_team': instance.get('study_team'),
            'creator_profile_pic_url': instance.get('creator_profile_pic_url'),
            'tasks': instance.get('tasks'),
            'due_status': instance.get('due_status'),
            'research_interests': instance.get('research_interests'),
            'type': instance.get('type'),
            'study_format': instance.get('study_format'),
            'is_contact_visible': instance.get('is_contact_visible'),
            'centre_format': instance.get('centre_format'),
            'recruiting_status': instance.get('recruiting_status'),
            'project_leads': instance.get('project_leads'),
        }


class ResearchProjectUserMentionsSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return {
            'user_profile': instance.get('user_profile'),
            'message': instance.get('message'),
            'discussion_board': instance.get('discussion_board'),
            'research_project': instance.get('research_project'),
            'link': instance.get('link')
        }


class UserRecentResearchTaskSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return {
            'task': instance.get('task'),
            'assigned_user_info': instance.get('assigned_user_info'),
        }


class ResearchProjectCalendarReminderPostSerializer(serializers.ModelSerializer):
    '''
    serializer for post and patch request.
    '''
    class Meta:
        model = ResearchProjectCalendarReminder
        fields = '__all__'


class ResearchProjectCalendarReminderGetSerializer(serializers.ModelSerializer):
    '''
    serializer for the get request based on the research_task, if there is a task
    attached to the instance we send it else not.
    '''
    class Meta:
        model = ResearchProjectCalendarReminder
        fields = ['title', 'description', 'due_date', 'calendar_reminder', 'creator', 'research_project', 'research_task', 'id']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        calendar_reminder_data = {
            'type': instance.calendar_reminder.type,
            'tag_colour': instance.calendar_reminder.tag_colour,
            'description': instance.calendar_reminder.description
        }
        data['calendar_reminder'] = calendar_reminder_data
        creator_data = {
            'first_name': instance.creator.first_name, 
            'last_name': instance.creator.last_name 
        }
        data['creator'] = creator_data
        # If research_task exists, include its data
        if instance.research_task_id:
            research_task_data = {
                'title': instance.research_task.title,
                'description': instance.research_task.description,
                'due_date': instance.research_task.due_date,
                'task_id': instance.research_task.id
            }
            data['research_task'] = research_task_data

        return data

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchProjectTask
        fields = '__all__'
        