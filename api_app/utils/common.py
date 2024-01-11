from django.apps import apps
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator, validate_email
from django.db import transaction
from django.db.models import Q
from django.shortcuts import reverse

from auth_app.utils.constants import EDITypes, EDI_FIELDS_DEV_CODE
from communication_app.models import Notification, DiscussionBoard
from communication_app.utils import NotificationTypes
from engage_app.models import ResearchProject, ResearchProjectTask


def remove_leading_trailing_whitespace(text: str) -> str:
    """Remove the leading and trailing whitespace from a string, this is useful for validating form data"""
    removed_trailing_whitespace_text = text.rstrip()
    return removed_trailing_whitespace_text.lstrip()


def delete_project(project_id):
    models_with_research_project_fk = get_models_with_research_project()
    models_not_to_delete = ['User', 'ResearchInterest']

    try:
        with transaction.atomic():
            # Before deleting the project get all the discussion board id's associated with the tasks of this project as a
            # reference to we can delete all associated notifications after deleting the related models
            discussion_board_ids = list(
                DiscussionBoard.objects.filter(
                    Q(parent_task__research_project_id=project_id) | Q(research_project_id=project_id)
                ).values_list('id', flat=True)
            )

            # Delete all related objects first except Notifications
            for model in models_with_research_project_fk:
                model_name = model.__name__
                if model_name not in models_not_to_delete:
                    key = get_key_of_project_id_in_model(model)
                    if key and model.objects.filter(**{key: project_id}).exists():
                        model.objects.filter(**{key: project_id}).delete()

            # Delete all notifications related to the project and discussion boards
            Notification.objects.filter(
                Q(source_id__in=discussion_board_ids, type=NotificationTypes.DISCUSSION.value) |
                Q(source_id=project_id, type=NotificationTypes.PROJECT.value)
            ).delete()

            # Now delete the project
            ResearchProject.objects.filter(id=project_id).delete()

            return True  # Indicate successful deletion
    except Exception as project_deletion_error:
        # Handle the exception if deletion fails
        return False


def get_models_with_research_project():
    models = apps.get_models()
    models_with = []

    for model in models:
        # Check if the model has a foreign key to ResearchProject
        for field in model._meta.get_fields():
            if field.is_relation and field.related_model == ResearchProject:
                models_with.append(model)
                break

    return models_with


def get_key_of_project_id_in_model(model):
    for field in model._meta.get_fields():
        if field.is_relation and field.related_model == ResearchProject:
            key_name = field.name
            queryset = model.objects.all()
            if not queryset.exists():
                return False
            return key_name
    return False


def is_valid_email(email):
    try:
        validate_email(email)
        return True
    except ValidationError:
        return False


def match_edi_values_from_insight_scope(edi_questions, response_data, edi_option):
    """
        Matches EDI (Equity, Diversity, and Inclusion) values from the provided response data based on a mapping defined by
        the development codes. For each development code (edi_dev_code), retrieves the corresponding question and options
        and maps the response data to the appropriate field based on the field mapping.

        Parameters:
            edi_questions (QuerySet): A QuerySet of UserProfileQuestion instances representing EDI questions.
            response_data (dict): A dictionary containing the response data for the EDI questions from insightScope.
            edi_option (QuerySet): A QuerySet of UserProfileOption instances representing EDI options.

        Returns:
            list: A list of dictionaries containing 'question' (question ID) and 'selected_options' for each EDI question.
    """


    edi_set_data = []
    for edi_dev_code, response_field in EDI_FIELDS_DEV_CODE.items():
        question_data = edi_questions.get(dev_code=edi_dev_code)

        # modify selected options first
        selected_options = response_data.get(response_field['field'])
        # if receiving a single instance string input, convert it into an array
        if isinstance(selected_options, str):
            selected_options = selected_options.split(',')
        # if other_option in selected options change it to other<free_text>
        if 'OTHER_OPTION' in selected_options:
            # Find the index of 'OTHER_OPTION' in the list
            index_of_other = selected_options.index('OTHER_OPTION')
            # Remove the 'OTHER_OPTION' from the list
            selected_options.pop(index_of_other)
            # Append the new value 'other<free_text>'
            selected_options.append('other<free_text>')
        # get the options based on the question
        question_options = edi_option.filter(question=question_data)
        # if options have a mapping store the mapping in a list
        option_mapping_list = [option.mapping for option in question_options]
        if response_field['type'] == None: 
            pass
        else:
            # loop over the selected options for the question
            for i in range(len(selected_options)):
                    # If the selected option is not in the mapping list then we have to store the title
                    if selected_options[i] not in option_mapping_list:
                        if selected_options[i] in response_field['type'].to_named_list():
                            # for truthy value on that index replace the value from mapping to title
                            selected_options[i]=response_field['type'].get_value_of_key(selected_options[i])

        edi_set_data.append({'question': question_data.id, 'selected_options': selected_options})

    return edi_set_data


def format_timedelta(td):
    """
        Formats a timedelta object into a human-readable format (days, hours, minutes, seconds).

        Args:
            td (timedelta): The timedelta object to be formatted.

        Returns:
            str: A human-readable representation of the timedelta.
    """
    days = td.days
    hours, remainder = divmod(td.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    # Format the timedelta without days if days is zero
    if days == 0:
        return f"{hours:02}hr : {minutes:02}mins"
    else:
        return f"{days} days, {hours:02}hr :{minutes:02}mins"


def is_string_an_url(url_string: str) -> bool:
    if not url_string.startswith('https://'):
        url_string = 'https://' + url_string

    validate_url = URLValidator()
    try:
        validate_url(url_string)
    except ValidationError:
        return False
    return True


def create_reported_message_instance(reported_item_instance):
    discussion_board_data = {}
    parent_message_detail = {}
    discussion_board = reported_item_instance.discussion_board
    parent_message = reported_item_instance.parent_message
    if discussion_board.parent_task_id:
        task = discussion_board.parent_task
        discussion_board_data = {
            'task_id': task.id,
            'task_title': task.title,
            'project_id': task.research_project_id,
            'project_title': task.research_project.title
        }
    elif discussion_board.research_project_id:
        project = discussion_board.research_project
        discussion_board_data = {
            'project_id': project.id,
            'project_title': project.title
        }
    if parent_message:
        parent_message_detail = {
            'sender_id': parent_message.sender.id,
            'sender_name': f"{parent_message.sender.first_name} {parent_message.sender.last_name}",
            'profile_link': reverse('auth_app:react_user_profile', args=[parent_message.sender.id]),
        }

    return {
        'message': reported_item_instance.content,
        'sender_id': reported_item_instance.sender.id,
        'sender_name': f'{reported_item_instance.sender.first_name} {reported_item_instance.sender.last_name}',
        'profile_link': reverse('auth_app:react_user_profile', args=[reported_item_instance.sender.id]),
        'discussion_board_data': discussion_board_data,
        'parent_message_detail': parent_message_detail
    }
