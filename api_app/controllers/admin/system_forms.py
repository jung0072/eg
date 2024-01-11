from django.contrib.postgres.aggregates import ArrayAgg
from django.db import transaction
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime

from api_app.serializers import ErrorSerializer, SuccessSerializer, ResearchInterestCategorySerializer, \
    SystemUserProfileQuestionSerializer, ResearchInterestSerializer
from api_app.utils.permissions import RequireAdmin
from auth_app.models import UserProfileQuestion, UserProfileSection, UserProfileAnswer, UserProfileOption, \
    ResearchInterest, UserProfileQuestionOptionDependency, UserProfile, ResearchInterestCategory
from auth_app.utils import generate_dev_code
from engage_app.utils import UserRoles


class CustomizeUserProfileQuestions(APIView):
    permission_classes = [IsAuthenticated, RequireAdmin]

    def get(self, request):
        """Retrieve the all the user profile questions from the system and their sections"""
        user_questions = UserProfileQuestion.objects.all().exclude(dev_code__istartswith="L-").order_by(
            'section__order_number', 'order_number'
        )
        user_sections = UserProfileSection.objects.all().order_by('order_number')
        section_json_list = [s.to_json() for s in user_sections]
        serialized_questions = SystemUserProfileQuestionSerializer(user_questions, many=True)

        return Response(
            data=dict(
                questions=serialized_questions.data,
                research_interests_types=ResearchInterest.get_all_types(),
                sections=section_json_list
            ),
            content_type="application/json",
            status=status.HTTP_200_OK
        )


class UserProfileQuestionController(APIView):
    permission_classes = [IsAuthenticated, RequireAdmin]

    def get(self, request, question_id):
        """Retrieve the details of the selected question based on the id"""
        user_profile_question = UserProfileQuestion.objects.filter(id=question_id).annotate(
            option_list=ArrayAgg('userprofileoption__id')
        )
        if not user_profile_question.exists():
            return Response(
                data=ErrorSerializer(dict(error="This user profile question does not exist")).data,
                content_type="application/json", status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            data=SystemUserProfileQuestionSerializer(user_profile_question.first()).data,
            content_type="application/json", status=status.HTTP_200_OK
        )

    def post(self, request):
        """Create a new User Profile Question and submit it to the DB"""
        # Get the attributes of the related models out of the request.data
        options_list = request.data.pop('options_list', None)
        new_parent_question_id = request.data.pop('parent_question_id', None)
        new_parent_question_option_id = request.data.pop('parent_question_option_id', None)
        research_interest_area = request.data.pop('research_interest_area', None)

        # Create a new dev code for this question, it should start with A- for admin created questions
        new_dev_code = generate_dev_code()
        serialized_question_data = SystemUserProfileQuestionSerializer(data=dict(**request.data, dev_code=new_dev_code))
        if serialized_question_data.is_valid():
            new_question = serialized_question_data.save()

            # Now that we have validated the question, add all the options to this question
            if options_list:
                for option in options_list:
                    UserProfileOption.objects.create(
                        question_id=new_question.id,
                        title=option['title'],
                        mapping=option['mapping'],
                        order_number=option['order_number'],
                    )

            # Check if we have a parent question and a parent option then create the new dependency
            if new_parent_question_id and new_parent_question_option_id:
                existing_question = UserProfileQuestion.objects.filter(id=new_parent_question_id)
                existing_option = UserProfileOption.objects.filter(id=new_parent_question_option_id)
                if existing_question.exists() and existing_option.exists():
                    UserProfileQuestionOptionDependency.objects.create(
                        dependant_question=new_question,
                        option_id=new_parent_question_option_id
                    )

            # Check if a research interest area was specified and set this as the category and linked to interests
            if research_interest_area:
                category = ResearchInterestCategory.objects.filter(mapping=research_interest_area)
                if category.exists():
                    UserProfileQuestion.objects.filter(id=new_question.id).update(
                        research_interest_category=category.first(), linked_to_research_interest=True
                    )

            # Now with the new question we can re-order all questions in the section before returning the response
            UserProfileQuestionController.re_order_questions_in_section(updated_question=new_question)
            UserProfileQuestionController.invalidate_profile_checks_for_affected_users(updated_question=new_question)
            return Response(
                serialized_question_data.data, status=status.HTTP_202_ACCEPTED, content_type="application/json"
            )

        # If we have an error we can send back the form errors to the user
        return Response(
            ErrorSerializer(dict(form_errors=serialized_question_data.errors)).data,
            status=status.HTTP_400_BAD_REQUEST,
            content_type="application/json"
        )

    def patch(self, request, question_id):
        """Update an existing question in the database after validating the PATCH request body"""
        # Make sure the question exists before trying to modify the database
        try:
            question = UserProfileQuestion.objects.get(id=question_id)
            dependency = UserProfileQuestionOptionDependency.objects.filter(dependant_question=question)
        except UserProfileQuestion.DoesNotExist:
            return Response(
                data=ErrorSerializer(dict(error="Cannot update this question, it does not exist")),
                content_type="application/json",
                status=status.HTTP_404_NOT_FOUND
            )
        # Before updating the question save a reference to its mandatory state, if it changes from False to True
        # we need to invalidate all profile checks for users
        old_mandatory_value = question.is_mandatory
        old_order_number = question.order_number

        # Get the attributes of the related models out of the request.data
        options_list = request.data.pop('options_list', None)
        new_parent_question_id = request.data.pop('parent_question_id', None)
        new_parent_question_option_id = request.data.pop('parent_question_option_id', None)
        research_interest_area = request.data.pop('research_interest_area', None)
        dependency = dependency.first()

        # Update the options list if we were given it
        if options_list:
            existing_options = UserProfileOption.objects.filter(question=question)
            for option in options_list:
                potential_option = existing_options.filter(id=option['id'])
                if potential_option.exists():
                    # Update an existing option and then exclude it from the existing options
                    potential_option.update(
                        title=option['title'],
                        mapping=option['mapping'],
                        order_number=option['order_number'],
                    )
                    existing_options = existing_options.exclude(id=option['id'])
                else:
                    # Create a new option for this entry
                    new_option = UserProfileOption.objects.create(
                        question=question,
                        title=option['title'],
                        mapping=option['mapping'],
                        order_number=option['order_number'],
                    )
                    existing_options = existing_options.exclude(id=new_option.id)
            # Now for any remaining options that were not update or created, delete them
            existing_options.delete()

        # If the parent question changed
        if new_parent_question_id and new_parent_question_id != question.parent_question_id:
            dependency.option_id = new_parent_question_option_id
            dependency.save()
        # If only the parent option changed
        elif new_parent_question_option_id and new_parent_question_option_id != dependency.option_id:
            dependency.option_id = new_parent_question_option_id
            dependency.save()

        # Update the category of options if a new research interest area was specified
        if research_interest_area:
            new_category = ResearchInterestCategory.objects.filter(mapping=research_interest_area).first()
            if new_category and question.research_interest_category != new_category:
                question.research_interest_category = new_category
                question.save()

        # Now that we have confirmed the question exists, validate the PATCH data with the instance and then save to db
        serialized_question_data = SystemUserProfileQuestionSerializer(
            instance=question, data=request.data, partial=True
        )
        if serialized_question_data.is_valid():
            updated_question = serialized_question_data.save()

            # Now with the updated question instance we can perform extra operations like reordering all questions,
            # invaliding profile checks and then return the response to the user
            if not old_mandatory_value and updated_question.is_mandatory:
                UserProfileQuestionController.invalidate_profile_checks_for_affected_users(
                    updated_question=updated_question
                )
            if old_order_number != updated_question.order_number:
                UserProfileQuestionController.re_order_questions_in_section(updated_question=updated_question)
            return Response(
                data=serialized_question_data.data,
                status=status.HTTP_200_OK,
                content_type="application/json"
            )

        # Return the error response if the request body was not valid
        return Response(
            ErrorSerializer(dict(form_errors=serialized_question_data.errors)).data,
            status=status.HTTP_400_BAD_REQUEST,
            content_type="application/json"
        )

    def delete(self, request, question_id):
        try:
            with transaction.atomic():
                # Query the question and make sure it exists, then delete all answers associated with the question
                # and all the options associated with the question. Keep a reference to the section id, so we can
                # re-order all the questions in the section after deleting.
                question = UserProfileQuestion.objects.get(id=question_id)
                deleted_question_section_id = question.section_id
                UserProfileQuestionOptionDependency.objects.filter(dependant_question=question).delete()
                UserProfileAnswer.objects.filter(question=question).delete()
                UserProfileOption.objects.filter(question=question).delete()
                question.delete()
                UserProfileQuestionController.re_order_questions_in_section(section_id=deleted_question_section_id)

                return Response(
                    data=SuccessSerializer(
                        dict(success=f"We have successfully deleted the question: {question_id}")
                    ).data,
                    status=status.HTTP_204_NO_CONTENT,
                    content_type="application/json"
                )
        except UserProfileQuestion.DoesNotExist:
            return Response(
                data=ErrorSerializer(dict(error="Cannot delete this question, it does not exist")).data,
                content_type="application/json", status=status.HTTP_404_NOT_FOUND
            )

    @staticmethod
    def re_order_questions_in_section(updated_question: UserProfileQuestion = None, section_id=None):
        """Re-order all UserProfileQuestion's that share a UserProfileSection with the updated question."""
        # First get the section id from the question or the section id depending on what was supplied
        user_profile_section_id = updated_question.section_id if updated_question else section_id

        # Query all the questions that share a section with the updated question. By ordering them by the order
        # number we can iterate over each question and set the new order_number to the index
        questions_in_section = UserProfileQuestion.objects.filter(
            section_id=user_profile_section_id
        ).order_by('order_number')
        for index, question in enumerate(questions_in_section):
            question.order_number = index + 1

        # Using bulk update we can update all the questions at once to avoid multiple database calls
        UserProfileQuestion.objects.bulk_update(questions_in_section, ['order_number'])

    @staticmethod
    def invalidate_profile_checks_for_affected_users(updated_question: UserProfileQuestion):
        """With a reference to the updated question, if this question is mandatory then update all user profile that
        share a role with the question. We should invalidate all minimum profile checks so users are re-routed back to
        the user profile form when the next login."""

        # First check if the question is mandatory, then build a query dict of all the affected roles
        if updated_question.is_mandatory:
            affected_user_role_query = Q()

            # Check if the question is required for researchers, if it is update clinicians and researchers
            if updated_question.is_required_researcher:
                affected_user_role_query |= Q(role=UserRoles.RESEARCHER.name)
                affected_user_role_query |= Q(role=UserRoles.CLINICIAN.name)

            # If the question is required for the family of patient, update all caretakers and family members
            if updated_question.is_required_family_of_patient:
                affected_user_role_query |= Q(role=UserRoles.FAMILY_OF_PATIENT.name)
                affected_user_role_query |= Q(role=UserRoles.CARETAKER.name)

            # Finally update all the patients and passive users if they are affected by the change
            if updated_question.is_required_patient:
                affected_user_role_query |= Q(role=UserRoles.PATIENT.name)
            if updated_question.is_required_passive:
                affected_user_role_query |= Q(role=UserRoles.PASSIVE.name)

            # With the dynamically built query we can query all the affected users and invalidate their profile checks
            UserProfile.objects.filter(affected_user_role_query).update(is_minimum_profile_check_valid=False)


class AdminResearchInterestsFormManagementController(APIView):
    permission_classes = [IsAuthenticated, RequireAdmin]
    serializer = ResearchInterestCategorySerializer

    def get(self, request):
        parent_research_interests = ResearchInterestCategory.objects.all().order_by('title')
        serialized_research_interest_categories = self.serializer(
            parent_research_interests, many=True
        )
        return Response(
            data=serialized_research_interest_categories.data,
            content_type="application/json",
            status=status.HTTP_200_OK
        )

    def post(self, request):
        # Serialize the data for the new category and validate it
        new_category_data = request.data.copy()
        serialized_category = self.serializer(data=new_category_data)

        # If the new category is valid save it and send the appropriate response
        if serialized_category.is_valid():
            serialized_category.save()
            return Response(
                data=serialized_category.data,
                content_type="application/json",
                status=status.HTTP_200_OK
            )
        return Response(
            data=ErrorSerializer(
                dict(error="Could not save this new category", form_errors=serialized_category.errors)
            ).data,
            content_type="application/json",
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, category_id):
        # First validate that the category exists by querying if from the db
        category_to_edit = ResearchInterestCategory.objects.filter(id=category_id)
        if category_to_edit.exists():
            # Once the category is validated we can serialize the data and validate
            updated_category_data = request.data.copy()
            serialized_category = self.serializer(
                instance=category_to_edit.first(), data=updated_category_data
            )

            # Save the category and send the appropriate response
            if serialized_category.is_valid():
                serialized_category.save()
                return Response(
                    data=serialized_category.data,
                    content_type="application/json",
                    status=status.HTTP_200_OK
                )

            # send the errors back to the admin
            return Response(
                data=ErrorSerializer(
                    dict(error="Could not edit this category", form_errors=serialized_category.errors)
                ).data,
                content_type="application/json",
                status=status.HTTP_400_BAD_REQUEST
            )

        # If we cannot find the category send the response to the admin
        return Response(
            data=ErrorSerializer(
                dict(error="Could not find the category to save at this time, please try again later")
            ).data,
            content_type="application/json",
            status=status.HTTP_404_NOT_FOUND
        )

    def delete(self, request, category_id):
        # First validate if the category exists and if it does exist we can delete it
        category = ResearchInterestCategory.objects.filter(id=category_id)
        if category.exists():
            try:
                category.delete()
            except ProtectedError:
                # If we hit the protected error we have to clear the interest 1 by 1
                interests = ResearchInterest.objects.filter(category=category.first())
                for ri in interests:
                    ri.delete_all_instances()
            return Response(
                data=SuccessSerializer(dict(success="We have successfully deleted the category")).data,
                content_type="application/json",
                status=status.HTTP_200_OK
            )

        # If the category does not exist send the response to the admin
        return Response(
            data=ErrorSerializer(dict(error="We could not find the category to delete at this time")).data,
            content_type="application/json",
            status=status.HTTP_404_NOT_FOUND
        )


class AdminResearchInterestOptionsController(APIView):
    permission_classes = [IsAuthenticated, RequireAdmin]

    def get(self, request, category_id):
        # First query the category to make sure it exists then query all the research interests under this category
        interest_category = ResearchInterestCategory.objects.get(id=category_id)
        research_interests = ResearchInterest.objects.filter(
            category=interest_category, parent_interest=None
        ).order_by('title')
        serialized_research_interests = ResearchInterestSerializer(research_interests, many=True)
        return Response(
            data=self.serialize_to_options_tree(serialized_research_interests.data),
            content_type="application/json",
            status=status.HTTP_200_OK
        )

    def post(self, request, category_id):
        # First validate if the interest category exists before updating any options
        interest_category = ResearchInterestCategory.objects.get(id=category_id)

        # Now query all the existing options to keep a reference to it during the transformation
        research_interests = ResearchInterest.objects.filter(category=interest_category, parent_interest=None)
        serialized_research_interests = ResearchInterestSerializer(research_interests, many=True)

        # Now using a copy of the request data, identify any changes to the original structure and make those updates
        # First create the options tree for the previous options for comparison
        old_research_interest_tree = self.serialize_to_options_tree(serialized_research_interests.data)
        new_research_interests_tree = request.data.copy()

        # Next can delete any options that are not detected in the new tree by using the key property (id)
        old_extracted_key_list = AdminResearchInterestOptionsController.extract_keys_from_multi_dimensional_list(
            list_to_flatten=old_research_interest_tree
        )
        new_extracted_key_list = AdminResearchInterestOptionsController.extract_keys_from_multi_dimensional_list(
            list_to_flatten=new_research_interests_tree
        )

        # Check if the key is in the flattened old key list, if it is not then we can safely delete that item
        for key in old_extracted_key_list:
            if key not in new_extracted_key_list:
                potential_old_interest = ResearchInterest.objects.filter(id=key)
                if potential_old_interest.exists():
                    interest_to_delete = potential_old_interest.first()
                    interest_to_delete.delete_all_instances()

        # Now iterate through the research interests in the new options and check each key to create or update the items
        AdminResearchInterestOptionsController.create_or_update_new_option_nodes(
            new_research_interests_tree, option_type=interest_category, user=request.user
        )

        # After updating all items in the DB we can return the success response
        return Response(
            data=SuccessSerializer(
                dict(success=f"We have successfully updated the options in the category: {interest_category.title}")
            ).data,
            status=status.HTTP_200_OK,
            content_type="application/json"
        )

    @staticmethod
    def serialize_to_options_tree(option_data):
        options_tree_list = []
        for option in option_data:
            potential_child_options = ResearchInterest.objects.filter(parent_interest_id=option['id'])
            child_options = {}
            if potential_child_options.exists():
                child_options = dict(
                    children=AdminResearchInterestOptionsController.serialize_to_options_tree(
                        ResearchInterestSerializer(potential_child_options, many=True).data
                    )
                )
            options_tree_list.append(dict(
                key=option['id'],
                title=option['title'],
                parent_interests_id=option['parent_interest'],
                **child_options
            ))
        return options_tree_list

    @staticmethod
    def extract_keys_from_multi_dimensional_list(list_to_flatten: list, extracted_key_list=None):
        # create the initial list if it is not supplied
        if extracted_key_list is None:
            extracted_key_list = []

        # Go through each item and add the key to the list and check if it has children, if it has children
        # recursively add its keys to the same list before returning the full list
        for item in list_to_flatten:
            extracted_key_list.append(item['key'])
            if "children" in item and item['children']:
                AdminResearchInterestOptionsController.extract_keys_from_multi_dimensional_list(
                    item['children'], extracted_key_list
                )
        return extracted_key_list

    @staticmethod
    def create_or_update_new_option_nodes(options_tree: list, option_type: ResearchInterestCategory, user):
        for new_node_dict in options_tree:
            node_id = new_node_dict['key']
            try:
                # Update the existing node with the new properties
                node = ResearchInterest.objects.get(id=node_id)
                node.title = new_node_dict['title']

                # Update the parent if it has changed
                new_parent_id = new_node_dict.get('parent_interests_id')
                if new_parent_id is not None:
                    new_parent = ResearchInterest.objects.get(id=new_parent_id)
                    node.parent_interest = new_parent
                else:
                    node.parent_interest = None
                node.save()

                # After updating this node we can recursively check if we need to update new nodes
                # by passing the children as the new options tree
                if "children" in new_node_dict and len(new_node_dict['children']) > 0:
                    AdminResearchInterestOptionsController.create_or_update_new_option_nodes(
                        new_node_dict['children'], option_type=option_type, user=user
                    )

            except ResearchInterest.DoesNotExist:
                # Create a new node if we cannot find an existing node with the key
                node = ResearchInterest(
                    title=new_node_dict['title'],
                    type=option_type.mapping,
                    approved_at=datetime.now(),
                    approved_by=user,
                    category=option_type,
                    created_by=user
                )

                # Set the parent if it's provided
                new_parent_id = new_node_dict.get('parent_interests_id')
                if new_parent_id is not None:
                    node.parent_interest = ResearchInterest.objects.get(id=new_parent_id)
                node.save()
