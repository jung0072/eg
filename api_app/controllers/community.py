from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api_app.serializers import CommunityListSerializer
from api_app.serializers.user_profile import UserProfileQuestionSerializer
from auth_app.models import UserProfile, UserProfileQuestion, UserProfileAnswer, ResearchInterest
from engage_app.utils import UserRoles, QuestionTypes
from datetime import datetime

DATE_QUESTION_TYPES = [
    QuestionTypes.DATE_PICKER.name,
    QuestionTypes.DATE_PICKER_YEAR.name
]


class CommunityListController(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        validated_user_filter_list = []
        user_supplied_filters = False
        if "filters" in request.data and len(request.data['filters']) > 0:
            # First get the filter list from the request and reduce it down to a list of ids
            filter_dict = request.data['filters']
            user_supplied_filters = True
            filter_id_list = list(filter_dict.keys())

            # Now with the list of ids, we can search for users that have given an answer to this question
            answers_query = UserProfileAnswer.objects.filter(question_id__in=filter_id_list)
            unique_user_id_list = list(set(answers_query.values_list("user_profile__user_id", flat=True)))
            validated_user_filter_list = unique_user_id_list.copy()

            # EDI Filter
            excluded_users_for_edi_filter = []
            for answer in answers_query:
                # If the question is an EDI question, check if the user has set their EDI answers to public
                # Don't add the user to the excluded list if they are already in the list
                if answer.question.dev_code.startswith("E") and (
                        answer.user_profile.user_id not in excluded_users_for_edi_filter
                ):
                    try:
                        show_edi_public = UserProfileAnswer.objects.get(
                            user_profile_id=answer.user_profile.user_id, question__dev_code="E-SETTING"
                        ).selected_options[0] == "True"
                    except UserProfileAnswer.DoesNotExist:
                        # If the user has not set their EDI setting, then we can assume they have not set their EDI answers to public
                        show_edi_public = False
                    if not show_edi_public:
                        excluded_users_for_edi_filter.append(answer.user_profile.user_id)
            # Remove the users who have set their EDI answers to non-public from validated_user_filter_list
            for user in excluded_users_for_edi_filter:
                validated_user_filter_list.remove(user)

            # For each user found in the user answers above, query the returned answers for their answers and if the
            # user has a match for that question we will add them to the valid id list, but if they don't have a match
            # for a question then we will remove them from the list and continue iterating over the user list
            for user in unique_user_id_list:
                # check if the user was removed from the validated user list, then we can skip them
                if user not in validated_user_filter_list:
                    continue

                # Query all the answers for this user, check if the answers query exists after limiting to this user
                # and check if the number of questions found matches the number of questions given by the user
                # performing the search
                user_answer_query = answers_query.filter(user_profile__user_id=user)
                if not answers_query.exists() or answers_query.count() < len(filter_id_list):
                    validated_user_filter_list.remove(user)
                    continue
                for user_answer in user_answer_query:
                    if user not in validated_user_filter_list:
                        continue

                    # Convert the selected options to a list and filter out any empty list values from the users
                    # selected answers
                    selected_options = list(
                        filter(lambda search: search != '', filter_dict[str(user_answer.question_id)])
                    )
                    users_selected_options = list(user_answer.selected_options)

                    # if the selected options from the user is a string, convert to a list
                    if type(selected_options) == str:
                        selected_options = [selected_options]
                    # Now based on the question type, modify the user profile answers to get the correct answers
                    if user_answer.question.type in DATE_QUESTION_TYPES and len(selected_options) == 2:
                        # Convert the users answers and the search dates from the range picker into date time
                        # objects using the year, month and day from the string or just the year based on the question
                        # type. Which is if we are using the year (4 characters) or full date (10 characters)
                        if user_answer.question.type == QuestionTypes.DATE_PICKER_YEAR.name:
                            user_time_index = 4
                            date_format = "%Y"
                        else:
                            user_time_index = 10
                            date_format = "%Y-%m-%d"

                        users_date_list = [
                            datetime.strptime(user_date[0:user_time_index], date_format) for user_date in
                            users_selected_options
                        ]
                        search_date_list = [
                            datetime.strptime(search_date, date_format) for search_date in selected_options
                        ]

                        # Now check if the user date is in-between the first and the second date in the search date list
                        if not (search_date_list[0] <= users_date_list[0] <= search_date_list[1]):
                            validated_user_filter_list.remove(user)

                        # Since the users date either passes or fails the check at this point, they can stay in the list
                        # and we can go to the next check or they get removed and we go to the next user
                        continue

                    # If the user question is a research interest, we need to need to map the values
                    # to the proper terms not ids
                    if user_answer.question.linked_to_research_interest:
                        users_selected_options = [
                            ResearchInterest.objects.get(id=interest).title for interest in users_selected_options
                        ]

                    if not any(selection in users_selected_options for selection in selected_options):
                        validated_user_filter_list.remove(user)
                        continue

        # get a reference to the current user profile to perform the checks below
        current_user_profile = UserProfile.objects.get(user=request.user)

        # Build the patient list if the user is an active researcher or patient partner
        community_list = []
        anon_count_patient = 0
        # TODO: We can probably optimize this block
        if current_user_profile.is_approved_researcher or current_user_profile.is_patient_partner:
            patient_list = UserProfile.objects.filter(role__in=UserRoles.get_patient_partner_types())
            # get the anon user count
            anon_count_patient=patient_list.filter(is_anonymous=True).count()
            # once we have the anon count update the patient list to exclude anon profiles
            patient_list = patient_list.filter(is_anonymous=False)
            if user_supplied_filters:
                patient_list = patient_list.filter(user_id__in=validated_user_filter_list)
            community_list = [patient.to_public_json() for patient in patient_list]

        # Now add on all the data for the approved researchers
        researcher_list = UserProfile.objects.filter(
            role__in=UserRoles.get_research_partner_types(), is_active_researcher=True
        ).exclude(user__username="admin")
        # get the researcher anon count
        anon_count_researcher=researcher_list.filter(is_anonymous=True).count()
        # once we have the count exclude anon users
        researcher_list = researcher_list.filter(is_anonymous=False)
        if user_supplied_filters:
            researcher_list = researcher_list.filter(user_id__in=validated_user_filter_list)

        # only send the anonymous user when we are not filtering
        # filter out the anon users
        if not user_supplied_filters:
            for _ in range(anon_count_patient+anon_count_researcher):
                new_anonymous_obj = {'is_anonymous': True}
                community_list.append(new_anonymous_obj)
        community_list = [*community_list, *[researcher.to_public_json() for researcher in researcher_list]]
        # serialize the data to return only the fields required for the community list and return the response as json
        serialized_data = CommunityListSerializer(community_list, many=True)
        return Response(data=serialized_data.data, content_type="application/json", status=status.HTTP_200_OK)


class CommunityListFiltersController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # First build a list of all the searchable user profile questions with their question ids, labels and
        # convert it to a json response before returning it to the user, this way they can build all the filters
        # for dynamic fields
        searchable_questions = UserProfileQuestion.objects.filter(
            is_searchable=True
        ).order_by('section__order_number').exclude(dev_code__istartswith="L-")  # Exclude language based questions

        serialized_data = UserProfileQuestionSerializer(searchable_questions, many=True)
        return Response(
            status=status.HTTP_200_OK, data=serialized_data.data, content_type="application/json"
        )
