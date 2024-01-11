import requests
from aws_s3_provider.S3Service import S3Service
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render, redirect

from cities_light.models import Country, City
from django.urls import reverse

from config import settings
from config.settings import config_provider
from engage_app.models import ResearchProject
from engage_app.utils.common import generate_fake_studies
from engage_app.utils.constants import UserRoles, EngageViews
from auth_app.models import UserProfile


def research_project_details(request, research_study_id):
    research_study = ResearchProject.objects.get(id=research_study_id)
    return JsonResponse(dict(research_study=research_study.to_json()), status=200)


def research_projects_list(request):
    """Generate a list of fake studies to be used as testing data"""
    return JsonResponse(dict(
        research_studies=generate_fake_studies(count=10, user_id=request.user.id)
    ), status=200)


def researcher_directory_list(request):
    """fetching the researchers list from the database"""
    page_title = "Researcher Directory"
    context = {
        "page_title": page_title,
        "current_user_profile": UserProfile.objects.get(user=request.user),
        "active_view": EngageViews.PARTNER_DIRECTORY.value
    }
    return render(request, "user-directory/researchers.html", context)


def get_user_list(request):
    user_list = []
    current_user_profile = UserProfile.objects.get(user=request.user)
    if 'X-REQUEST-PATIENT-LIST' in request.headers:
        if not current_user_profile.is_researcher() or not current_user_profile.is_active_researcher:
            return JsonResponse(dict(
                error="You do not have the rights to access this page. Please contact the admin if you think this is a mistake")
            )
        else:
            user_list = UserProfile.objects.filter(role__in=UserRoles.get_patient_partner_types())
    else:
        user_list = UserProfile.objects.filter(Q(role=UserRoles.RESEARCHER.name) | Q(role=UserRoles.CLINICIAN.name))

    return JsonResponse(dict(
        data=[u.to_json() for u in user_list]
    ), status=200)


def patient_directory_list(request):
    """Generate a list of fake researchers to be used as testing data"""
    # First check if the user accessing the page is an approved researcher, if not they will be given an error response
    current_user_profile = UserProfile.objects.get(user=request.user)

    if not current_user_profile.is_researcher() or \
            (current_user_profile.is_researcher() and current_user_profile.is_pending_researcher):
        return JsonResponse(dict(
            error="You do not have the rights to access this page. Please contact the admin if you think this is a mistake")
        )

    page_title = "Patient Directory"

    context = {
        "page_title": page_title, "current_user_profile": current_user_profile,
        "active_view": EngageViews.PARTNER_DIRECTORY.value
    }
    return render(request, "user-directory/patients.html", context)


def city_list(request):
    # TODO: Modify so we can check if a currently selected city in the UserProfile or the ResearchStudy is selected
    country = Country.objects.get(name="Canada")
    cities = City.objects.filter(country_id=country.id)

    city_json_list = list()
    for city in cities:
        city_json_list.append({
            "name": city.name,
            "countryId": city.country_id,
            "cityId": city.id
        })

    return JsonResponse(dict(
        cities=city_json_list,
    ), status=200)


MAX_IMAGE_SIZE = 2.5 * 1024 * 1024


def upload_user_photo(request):
    return_url = redirect(reverse('engage_app:display_user_profile', args=[request.user.id]))
    current_user = request.user
    if request.method == 'POST':
        if request.FILES['file1']:
            file = request.FILES['file1']

            if file.size > MAX_IMAGE_SIZE:
                return return_url

            file_name = current_user.username + '.' + file.name.split('.')[-1]

            file_name = S3Service(settings.AWS_S3_BUCKET_INSIGHTSCOPE).upload_user_photo(current_user.id, file_name,
                                                                                             file)

            user = UserProfile.objects.get(pk=current_user.id)
            user.profile_picture = file_name
            user.save()

            # Send this back to InsightScope so it is updated too
            # we dont have to do that as both platforms are segregated, commenting out to test engage without sso
            # post_data = {'profile_picture': user.profile_picture}
            # requests.post(
            #     url=f'{config_provider.get_config("sso", "server")}/engage/user_data/',
            #     data=post_data,
            #     headers={
            #         "X-API-KEY": settings.API_KEY, 'X-USERNAME': request.user.username,
            #         'X-USER-EMAIL': request.user.email
            #     }
            # )

        return return_url
