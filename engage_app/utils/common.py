import uuid
import datetime
import random
import secrets
import string

from django.contrib.auth.models import User
from django.http import QueryDict

from engage_app.utils import DateTypes


def create_alphanumeric_code(length):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length)).upper()


# TODO: remove and refactor this to a Research Project Factory Method to be used in Tests
def generate_fake_studies(count: int, user_id: int):
    from engage_app.models import ResearchProject

    """Use this function to generate a single or list of fake projects"""
    user = User.objects.get(id=user_id)
    studies = []
    for i in range(1, count):
        random_int = random.randint(0, 10)
        fake_study = ResearchProject.objects.create(
            creator=user,
            title="Research Study Project Title",
            reference_name=create_alphanumeric_code(4),
            description="We strive to investigate and experiment.",
            start_date=datetime.date(2021, 9, 14),
            end_date=datetime.date(2021, 12, 14),
            icu_city="Ottawa" if random_int > 5 else "Toronto",
            icu_country="Canada",
            partner_commitment_description="2 Hours every 3 Weeks",
            roles_needed=['Family', 'Patient Partners'],
            is_approved=True,
            created_at=datetime.date(2021, 9, 10),
            updated_at=datetime.date(2021, 9, 12),
        )
        fake_study.save()
        studies.append(fake_study.to_json())

    return studies


def convert_query_dict_to_dict(query_dict: QueryDict):
    """Function to convert a QueryDict object like the request.POST to a Dict. Useful for times when we have to process
    form requests without django form objects
        Reference Link: https://stackoverflow.com/a/56350262/13801570"""
    converted_dict = dict()
    for key in query_dict.keys():
        value_list = query_dict.getlist(key)
        converted_dict[key] = value_list if len(value_list) > 1 else value_list[0]
    return converted_dict


# Based on stack overflow post: https://stackoverflow.com/a/54254115
def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False


def generate_temp_password():
    alphabet = string.ascii_letters + string.digits
    return ''.join(random.choice(alphabet) for _ in range(16))


def clean_estimated_dates(cleaned_data, is_using_date_key, date_type_key, date_key):
    """
    Cleans and formats estimated dates based on certain conditions.

    Args:
    cleaned_data (dict): A dictionary containing data to be cleaned.
    is_using_date_key (str): The key for the flag indicating if the date is being used.
    date_type_key (str): The key for the type of date (e.g., DAY_MONTH, MONTH_YEAR, YEAR).
    date_key (str): The estimated date.

    Returns:
    dict: The cleaned data dictionary with modified date values and keys.
    """
    is_using_date = cleaned_data.get(is_using_date_key)
    date_type = cleaned_data.get(date_type_key)
    est_date = cleaned_data.get(date_key)

    if is_using_date == False:
        cleaned_data[date_type_key] = None

    if is_using_date:
        if date_type == DateTypes.DAY_MONTH.name:
            est_date = datetime.date(year=1, month=est_date.month, day=est_date.day)
        elif date_type == DateTypes.MONTH_YEAR.name:
            est_date = datetime.date(year=est_date.year, month=est_date.month, day=1)
        elif date_type == DateTypes.YEAR.name:
            est_date = datetime.date(year=est_date.year, month=1, day=1)
        elif date_type == DateTypes.EXACT_DATE.name:
            pass

    cleaned_data[date_key] = est_date if is_using_date else None
    return cleaned_data
