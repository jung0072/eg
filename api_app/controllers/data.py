from abc import ABC

from cities_light.models import Country, City
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from api_app.serializers import ResearchInterestsSerializer
from auth_app.models import ResearchInterest
from engage_app.utils import ResearchInterestTypes


class GetCanadianCitiesView(APIView):
    def get(self, request):
        # TODO: create a getter function to get the users current city
        # Retrieve all canadian cities, map each city to a json object and return back to the user
        canadian_cities_list = list()
        canada = Country.objects.get(name='Canada')
        cities = City.objects.filter(country_id=canada.id)

        for city in cities:
            canadian_cities_list.append({
                "name": city.name,
                "id": city.id
            })
        serialized_data = CanadianCitiesSerializer(canadian_cities_list, many=True)
        return Response(serialized_data.data, content_type="application/json", status=200)


class CanadianCitiesSerializer(serializers.BaseSerializer, ABC):
    def to_representation(self, instance):
        return {
            'name': instance.get('name'),
            'id': instance.get('id'),
        }


class ResearchInterestsController(APIView):
    """Retrieve all the research interests from the system, can be used for form options"""

    def get(self, request):
        research_interests = ResearchInterest.objects.filter(
            type=ResearchInterestTypes.RESEARCH.name, parent_interest=None
        ).order_by('title')
        interests_list = [interest.to_json(add_sub_options=True) for interest in research_interests]
        serialized_data = ResearchInterestsSerializer(interests_list, many=True)
        return Response(
            content_type="application/json", data=serialized_data.data,
            status=status.HTTP_200_OK
        )
