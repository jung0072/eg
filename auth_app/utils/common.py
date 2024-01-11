import json
import logging
import os
import random
import string
from base64 import b64encode
from datetime import date, datetime, timedelta, time

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils.http import urlsafe_base64_decode

from auth_app.utils.constants import BACKGROUND_TASK_DURATIONS
from base_app.models import BaseOption
from config.settings import BASE_DIR

logger = logging.getLogger(__name__)


def get_default_profile_picture():
    """
    Returns an encoded version of the default avatar from the static assets.
    """
    file_abs_path = os.path.dirname(os.path.abspath(__file__))
    with open(f'{file_abs_path}/../static/img/default-profile-picture.png', 'rb') as photo:
        # inside the with block file will be automatically closed
        return b64encode(photo.read())


def get_run_at(system_settings, email_repetition, date_required=False):
    today = datetime.now()
    repetition_duration = system_settings.selected_value
    email_repetition_value = email_repetition.text_value
    if repetition_duration == BACKGROUND_TASK_DURATIONS.WEEKLY.get(
            'value') or repetition_duration == BACKGROUND_TASK_DURATIONS.BI_WEEKLY.get('value'):
        days_until_next_run = ((int(email_repetition_value) - 1 - today.weekday() + 7) % 7) \
            if repetition_duration == BACKGROUND_TASK_DURATIONS.WEEKLY.get(
            'value') else ((int(email_repetition_value) - 1 - today.weekday() + 14) % 14)
        next_run_at = datetime.combine((today + timedelta(days=days_until_next_run)).date(), time(12, 0, 0), tzinfo=today.tzinfo)
    elif repetition_duration == BACKGROUND_TASK_DURATIONS.MONTHLY.get('value'):
        month = today.month
        year = today.year
        day = int(email_repetition_value)
        if day <= today.day:
            month += 1
        next_run_at = datetime(year, month, day, 12, 0, 0, 0, tzinfo=today.tzinfo)
    elif repetition_duration == BACKGROUND_TASK_DURATIONS.YEARLY.get('value'):
        if not str(email_repetition_value).__contains__(','):
            email_repetition_value += ',1'
        values = email_repetition_value.split(',')
        month = int(values[0])
        day = int(values[1])
        year = today.year
        if month < today.month:
            year += 1
        next_run_at = datetime(year, month, day, 12, 0, 0, 0, tzinfo=today.tzinfo)
    elif repetition_duration == BACKGROUND_TASK_DURATIONS.NEVER.get('value'):
        next_run_at = datetime.combine((today - timedelta(days=1)).date(), time(12, 0, 0, 0), tzinfo=today.tzinfo)
    else:
        next_run_at = datetime.combine((today + timedelta(days=1)).date(), time(12, 0, 0, 0), tzinfo=today.tzinfo)
    logger.info("Next Mail coming on: ", next_run_at)
    if date_required:
        return next_run_at
    return int((next_run_at - today).total_seconds())


def reverse_create_model(apps, app_name, model_name):
    Model = apps.get_model(app_name, model_name)
    Model.objects.all().delete()


def create_sections_from_json_list(json_file_path, section_model):
    """Create the sections defined from the JSON file located at the supplied file path. Create the sections for the
    supplied model.
    parameters:
        - json_file_path str the file path of the data file containing the sections
        - section_model: A BaseSection typed model in which we will use to create the db entries"""
    with open(json_file_path, 'r', encoding="cp866") as initial_user_profile_sections_file:
        section_json_list = json.load(initial_user_profile_sections_file)['sections']
        for section in section_json_list:
            new_section = section_model.objects.create(**section)
            new_section.save()


def create_speak_read_write_question(language, language_code, question_id):
    # Will create the developer code for each question using the language code by replacing any hyphens in the world
    # language code and capitalize the string
    # TODO: change this to make it work with the rendering engine probably using rendering_engine type (SELECT_MULTIPLE_BOX)
    dev_code = "L-" + language_code.replace('-', '').upper()
    return {
        "dev_code": dev_code,
        "section": None,
        "parent_question_id": question_id,
        "order_number": 0,
        "type": "SELECT",
        "is_required_researcher": True,
        "is_required_patient": True,
        "is_required_family_of_patient": True,
        "is_required_passive": True,
        "text_for_researcher": f"How well do you understand {language}",
        "text_for_patient": f"How well do you understand {language}",
        "text_for_family_of_patient": f"How well do you understand {language}",
        "text_for_caretaker_of_patient": f"How well do you understand {language}",
        "text_for_passive": f"How well do you understand {language}",
        "help_text": "",
        "options": [
            "Speak",
            "Read",
            "Write"
        ]
    }


def create_user_profile_question(question_model, section_model, question_dict: dict, parent_question_id=None):
    # first find the section based on the name and then after removing the section, unpack the remaining json
    # into the creation of a new user profile object
    section = section_model.objects.filter(name=question_dict['section']).first()
    options_list = question_dict.pop('options', None)
    del question_dict['section']

    # check if we were given the parent_question_id, then override the default value, then create the question
    if parent_question_id:
        question_dict['parent_question_id'] = parent_question_id
    new_question = question_model.objects.create(
        **question_dict, section=section
    )
    return options_list, new_question


def create_question_from_json(
        question_json, question_model, section_model, option_model, opt_dependency_model, interests_model,
        developer_code_list, parent_question_id=None, parent_option_id=None
):
    """Will create the question from the supplied JSON for the supplied models. All models should be a child of a
     BaseQuestion, BaseSection, and BaseOptions. Will use the supplied developer code list collection to keep track
     of all created codes to maintain uniqueness"""
    from engage_app.utils import ResearchInterestTypes

    # Check if we have any direct sub-questions, these would be questions inside a SELECT_SECTION form input
    direct_sub_questions = question_json.pop('subQuestions', None)

    # Check if we were supplied a parent question id, if so add it to the creation statement
    parent_question_dict = {'parent_question_id': parent_question_id} if parent_question_id else {}
    options_list, new_question = create_user_profile_question(
        question_model, section_model, question_json, **parent_question_dict
    )

    if direct_sub_questions:
        # For each sub question found for this question, directly add the question id from the new question
        # and recursively create these new questions
        for child_question in direct_sub_questions:
            child_question['parent_question_id'] = new_question.id
            options_list, new_sub_question = create_user_profile_question(
                question_model, section_model, child_question
            )

    # If supplied a parent option id we need to create the question option dependency for this question
    if parent_option_id:
        opt_dependency_model.objects.create(
            option_id=parent_option_id,
            dependant_question=new_question
        )
    developer_code_list.append(question_json['dev_code'])

    # Create a list of all of the options_list choices for research interests
    research_interests_choice_list = [
        "research_interests", "comorbidities", "icu_occurrences", "icu_admissions", "icu_interventions", "institutions"
    ]
    # finally for each option in the options list create a new option related to the question
    if options_list:
        # TODO: Update with the new options for icu_admissions, icu_interventions, comorbidities, icu_occurrences, universities
        if options_list == "canadian_city":
            option_model.objects.create(title="Canadian Cities", question=new_question)
        elif options_list == "pediatric_critical_care" or options_list == "pediatric_emergency_medicine" or \
                options_list == "infectious_disease":
            clinical_area = options_list.capitalize().replace('_', ' ')
            option_model.objects.create(title=clinical_area, mapping=options_list, question=new_question)
        elif options_list in research_interests_choice_list:
            # IF we have a research interests type, first get the proper type from the given choice
            research_interest_type = None
            match options_list:
                case "research_interests":
                    research_interest_type = ResearchInterestTypes.RESEARCH.name
                case "comorbidities":
                    research_interest_type = ResearchInterestTypes.COMORBIDITY.name
                case "icu_occurrences":
                    research_interest_type = ResearchInterestTypes.ICU_OCCURRENCES.name
                case "icu_admissions":
                    research_interest_type = ResearchInterestTypes.ICU_ADMISSIONS.name
                case "icu_interventions":
                    research_interest_type = ResearchInterestTypes.ICU_INTERVENTIONS.name
                case "institutions":
                    research_interest_type = ResearchInterestTypes.INSTITUTION.name
                case _:
                    return TypeError("Research Interest type does not exist", options_list)
            question_choices = interests_model.objects.filter(type=research_interest_type)
            for choice in question_choices:
                option_model.objects.create(title=choice.title, mapping=choice.mapping, question=new_question)

            # Now that the new question is linked to the research interests, set the boolean field and save
            new_question.linked_to_research_interest = True
            new_question.save()
        elif options_list == "world_languages":
            # Using the world language json file, create an option for each language with a code mapping
            world_languages_file_path = os.path.join(
                BASE_DIR, 'auth_app', 'static', 'data', 'world_languages.json'
            )
            with open(world_languages_file_path, 'r', encoding='utf-8') as world_languages_file:
                # load the json from the file and then by looping over the key/ values in the items
                # create an option for each language and a dependant question using the language value.
                # With both of these items, create a question option dependency to link the option/ question
                data = json.load(world_languages_file)
                for key, val in data.items():
                    # create the option and get the dict of the questions values
                    option = option_model.objects.create(title=val, mapping=key, question=new_question)
                    question_dict = create_speak_read_write_question(val, key, new_question.id)
                    # remove the options list like above and create the question, then create each option for
                    # the new question
                    dependant_question_options_list = question_dict.pop('options', None)

                    # check if the developer code is already used
                    if question_dict['dev_code'] not in developer_code_list:
                        # Create the new language question and add the new code to the list
                        dependant_question = question_model.objects.create(**question_dict)
                        developer_code_list.append(question_dict['dev_code'])
                    else:
                        # Add the old code to the list and increment it before adding the new code to the list
                        # This is to avoid situations with multiple language inputs
                        developer_code_list.append(question_dict['dev_code'])
                        question_dict['dev_code'] += str(
                            developer_code_list.count(question_dict['dev_code']) + 1
                        )
                        dependant_question = question_model.objects.create(**question_dict)
                        developer_code_list.append(question_dict['dev_code'])

                    for language_option in dependant_question_options_list:
                        option_model.objects.create(title=language_option, question=dependant_question)
                    # for each option they are depending on the
                    opt_dependency_model.objects.create(
                        option=option,
                        dependant_question=dependant_question
                    )
        else:
            for option in options_list:
                if isinstance(option, str):
                    # Create a regular option based on the string value
                    option_model.objects.create(title=option, question=new_question)
                elif isinstance(option, dict):
                    # Check if the option has the keys options_text and code, if so we need to set the code
                    # as the option mapping but if they are not set then the option is an another question
                    if all(key in option.keys() for key in ["title", "mapping"]):
                        option_model.objects.create(**option, question=new_question)
                    else:
                        # We have sub questions, so create the option and then create then recursively create the
                        # corresponding questions and options dependencies required for the question
                        new_option = option_model.objects.create(
                            title=option['option'], question=new_question
                        )
                        for sub_question in option['subQuestions']:
                            create_question_from_json(
                                sub_question, question_model, section_model, option_model,
                                opt_dependency_model, interests_model, developer_code_list,
                                parent_question_id=new_question.id,
                                parent_option_id=new_option.id
                            )


def calculate_years_from_date(from_date):
    today = date.today()
    return today.year - from_date.year - ((today.month, today.day) < (from_date.month, from_date.day))


# decoding user_id that is received from front-end to return the user information
def decode_user(uidb64):
    try:
        # urlsafe_base64_decode() decodes to bytestring
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User._default_manager.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist, ValidationError):
        user = None
    return user


def add_order_number_field_to_existing_options(option_model: BaseOption):
    # Get a Reference to the Option Model and query all the options ordered by the question id and then their
    # respective option id's
    options = option_model.objects.order_by('question_id', 'created_at')

    # Initialize the references for the last question and the order number counter
    last_question = None
    order_counter = 1
    for opt in options:

        # Check if we are dealing with options from a new question and if we are reset the counter for the new question
        if last_question != opt.question_id:
            order_counter = 1

        # Set the order number for the option, increment the counter for each option under the same question and save
        # the reference to the last question id for comparison
        opt.order_number = order_counter
        last_question = opt.question_id
        order_counter += 1

    option_model.objects.bulk_update(options, ['order_number'])


def reverse_add_order_number_field_to_existing_options(option_model: BaseOption):
    # Get a reference to the option model and set all the order_numbers to 0
    option_model.objects.all().update(order_number=0)


def generate_dev_code():
    from auth_app.models.user_profile.user_profile_question import UserProfileQuestion
    while True:
        # Generate the last 4 characters as capitalized letters
        random_letters = ''.join(random.choices(string.ascii_uppercase, k=4))
        dev_code = f"A-{random_letters}"

        # Check if the dev_code already exists in the database
        # You will need to replace 'YourModel' with the actual name of your model
        if not UserProfileQuestion.objects.filter(dev_code=dev_code).exists():
            return dev_code


def add_research_interest_from_file(interest_model, research_interest_info_dict, admin):
    from django.utils import timezone

    last_item = None  # The last item we added
    stack = []  # The parents in our current hierarchy
    indent_level = 0  # The level of indentation on the last-read line
    indent_size = 2  # The number of spaces per indent level in the file

    # get a reference to the admin and all applicable models
    with open(research_interest_info_dict['file'], 'r') as file:
        for line in file:
            # Get the name of the research interest
            line = line.rstrip()
            research_interest_name = line.lstrip()

            # Check what indentation level this is at
            line_indent_level = int((len(line) - len(research_interest_name)) / indent_size)
            if line_indent_level > indent_level:
                # If it's greater than the previous, push the last item into the stack
                stack.append(last_item)
            elif line_indent_level < indent_level:
                # If it's less than the previous, pop the previous parent off the stack
                for _ in range(indent_level - line_indent_level):
                    stack.pop()
            indent_level = line_indent_level

            # Create the research interest in the database
            parent = stack[-1] if stack else None
            last_item = interest_model.objects.create(
                title=research_interest_name, parent_interest=parent,
                created_by=admin, approved_by=admin, approved_at=timezone.now(),
                type=research_interest_info_dict['type']
            )


def add_research_interest_category_to_question(question_model, option_model, interest_model):
    # First iterate over each question that is linked to research interest
    questions_linked_to_interests = question_model.objects.filter(linked_to_research_interest=True)
    for question in questions_linked_to_interests:
        option = option_model.objects.filter(question=question)
        # If we find an option, get the research interests based off the first option
        if option.exists():
            research_interest = interest_model.objects.filter(title=option.first().title)
            if research_interest.exists():
                # Switch from a null category to the research interest category
                question.research_interest_category = research_interest.first().category
                question.save()
        # Finally delete all the options for this question (since it is fully linked to research interests)
        option_model.objects.filter(question=question).delete()


def reverse_research_interest_categories_on_question(question_model):
    questions_linked_to_interests = question_model.objects.filter(linked_to_research_interest=True)
    for question in questions_linked_to_interests:
        question.research_interest_category = None
        question.save()
