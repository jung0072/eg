from django.http import JsonResponse, HttpResponse, HttpResponseNotAllowed, QueryDict

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from auth_app.views.serializers.user_serializer import UserProfileSerializer

from auth_app.models import UserProfile, UserProfileQuestion, ResearchInterest
from auth_app.forms.user_profile import UserProfileForm


class UserProfileController(APIView):
    """Return the info for the Systematic Review and its dashboard settings if they are published"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        
        current_user_profile = UserProfile.objects.get(user_id=request.id)
        
        _, formatted_post_data = get_basic_profile_settings_form_data(request.data.copy())
        
        request.data["research_interests"] = current_user_profile.research_interests
        request.data["user_location"] = current_user_profile.user_location
        request.data["icu_location"] = current_user_profile.icu_location
        request.data["role"] = current_user_profile.role
        request.data["population_group"] = current_user_profile.population_group

        profile_form = UserProfileForm(request.data, request.FILES, instance=current_user_profile)

        if not profile_form.is_valid():
            print(profile_form.errors, "errors in form")

        if profile_form.is_valid():
            is_researcher_ready_for_review = True
            # commenting this out as the rendering engine forms are not implemented
            # current_user_profile.save_answers(formatted_post_data, is_researcher_ready_for_review)
            current_user_profile=profile_form.save(request.id)
            # commenting it out to confirm research interest field in the current form
            # current_user_profile.research_interests.set(profile_form.cleaned_data['research_interests'])
            
            current_user_profile.save()
            
            return Response("User profile is updated", status=status.HTTP_200_OK)
    
    def get(self, request):
        
        user_profile = UserProfile.objects.get(user__id=request.id)

        user_profile_info = {
            'gender': user_profile.gender,
            'sexual_orientation': user_profile.sexual_orientation,
            'population_group': user_profile.population_group,
            'most_used_language': user_profile.most_used_language,
            'is_visible_minority': user_profile.is_visible_minority,
            'is_identified_native': user_profile.is_identified_native,
            'has_disability': user_profile.has_disability,
            'first_language': user_profile.first_language,
            'edi_answers_public': user_profile.edi_answers_public
        }

        serialized_data = UserProfileSerializer(user_profile_info)

        return Response(data=serialized_data.data, status=status.HTTP_200_OK)

def get_basic_profile_settings_form_data(post_data):
    basic_settings_form_data_dict = dict()
    # Remove all of the items related to the profile form from the post data Query Dict so we can send only the
    # remaining items to the profile form settings save method
    for setting in UserProfileForm.Meta.fields:
        if setting in post_data:
            basic_settings_form_data_dict[setting] = post_data.pop(setting) if isinstance(post_data[setting], bool) else post_data.pop(setting)[0]

    # Convert the dict into a query dict to be properly parsed by the django request/ response fn's
    basic_settings_query_dict = QueryDict('', mutable=True)
    basic_settings_query_dict.update(basic_settings_form_data_dict)
    return basic_settings_query_dict, post_data
