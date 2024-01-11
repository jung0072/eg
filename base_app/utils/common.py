from django.contrib.auth.hashers import make_password
from django.db import IntegrityError
from django.contrib.auth.models import User
from auth_app.models import UserProfile

from api_app.utils import remove_leading_trailing_whitespace
from engage_app.utils.common import generate_temp_password


def create_new_user(user_info):
    try:
        new_user_email = remove_leading_trailing_whitespace(user_info["email"].lower())
        temp_password = generate_temp_password()
        new_user_password = make_password(temp_password)
        first_name=user_info.get('first_name', '')
        last_name=user_info.get('last_name', '')
        new_user = User.objects.create(
            password=new_user_password,
            email=new_user_email,
            username=new_user_email,
            first_name=first_name,
            last_name=last_name
        )
        new_user_profile = UserProfile.objects.create(user=new_user, role=user_info['role'])

        return {'user': new_user, 'new_user_profile': new_user_profile, 'temp_password': temp_password}
    except IntegrityError as user_integrity:
        raise Exception({
            'email': new_user_email,
            'first_name': first_name,
            'last_name': last_name,
        })
