from django.db import models

from base_app.models import BaseQuestion


class UserProfileQuestion(BaseQuestion):
    parent_question = models.ForeignKey(
        'self', related_name='%(app_label)s_%(class)s_parent_question', on_delete=models.CASCADE, null=True, blank=True
    )
    # Questions belong to parent sections, if no section is set a question will not appear on a user profile form
    section = models.ForeignKey('UserProfileSection', on_delete=models.SET_NULL, null=True, blank=True)

    def to_json(self, add_sub_questions=True, parent_option_id=None, user_profile=None, add_sub_question_opt_ids=True):
        from auth_app.models.user_profile.user_profile_answer import UserProfileAnswer
        from auth_app.models.research_interest import ResearchInterest

        # First get a list of all the options for the question
        options_queryset = self.userprofileoption_set.all().order_by('order_number')

        # Now check each option in the list to see if there are any question option dependencies entries
        # if we do have one, add the dependant question to the sub questions list and return to the user
        sub_questions_list = list()
        if add_sub_questions:
            options_with_dependencies = options_queryset.prefetch_related(
                'user_profile_dependant_option__dependant_question'
            )
            for option in options_with_dependencies:
                dependant_questions = option.user_profile_dependant_option.all()
                sub_questions_list.extend([
                    dep.dependant_question.to_json(add_sub_questions=False, parent_option_id=option.id)
                    for dep in dependant_questions
                ])

        # Check if there are any answers supplied, if the user profile was given, this is used when reloading the form
        user_answers_dict = {}
        if user_profile:
            user_answer = UserProfileAnswer.objects.filter(question=self, user_profile=user_profile).first()
            if user_answer:
                user_answers_dict['user_answer'] = user_answer.selected_options

        # Build the options list, if we are linked to research interests and the options exist, we should
        # check to see if we are using research interests list and then switch to our tree style options model
        # otherwise we can convert our options to json and return them
        options_list = None
        if self.linked_to_research_interest:
            if not options_queryset.exists():
                potential_interests = ResearchInterest.objects.filter(
                    category=self.research_interest_category, parent_interest=None
                )
                options_list = [interest.to_json(True) for interest in potential_interests]
        else:
            options_list = [option.to_json(add_sub_question_opt_ids) for option in options_queryset]

        extra_attributes_dict = dict()
        if self.parent_question:
            from auth_app.models.user_profile.user_profile_option import UserProfileOption
            extra_attributes_dict['parent_option_choice'] = UserProfileOption.objects.filter(
                user_profile_dependant_option__dependant_question__id=self.id
            ).first().title

        return dict(
            parent_option_id=str(parent_option_id),
            parent_question_id=str(self.parent_question_id),
            options=options_list,
            section=str(self.section.id) if self.section else None,
            section_name=str(self.section.name) if self.section else '',
            sub_questions=sub_questions_list,
            label=self.label,
            **extra_attributes_dict,
            **user_answers_dict,
            **super().to_json()  # expand the results from the to_json from the base question
        )

    def get_parent_question_count(self) -> (int, list):
        """Get the number of parent questions to this question to see how many levels deep it is.
                Returns: int [0 means no parent questions, 1 means 1 and so on]
        """
        parent_question = self.parent_question
        parent_question_list = []
        parent_count = 0
        while parent_question is not None:
            parent_count += 1
            parent_question_list.append(parent_question)
            parent_question = parent_question.parent_question
        return parent_count, parent_question_list
