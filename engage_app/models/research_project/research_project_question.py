from django.db import models

from base_app.models import BaseQuestion

from engage_app.models.research_project.research_project_question_option_dependency import \
    ResearchProjectQuestionOptionDependency


class ResearchProjectQuestion(BaseQuestion):
    parent_question = models.ForeignKey(
        'self', related_name='%(app_label)s_%(class)s_parent_question', on_delete=models.CASCADE, null=True, blank=True
    )
    # Questions belong to parent sections, if no section is set a question will not appear on a user profile form
    section = models.ForeignKey('ResearchProjectSection', on_delete=models.SET_NULL, null=True, blank=True)

    def to_json(self, add_sub_questions=True, parent_option_id=None, research_project=None):
        from engage_app.models.research_project.research_project_option import ResearchProjectOption
        from engage_app.models.research_project.research_project_answer import ResearchProjectAnswer
        # TODO: Refactor this and the UserProfileQuestion to_json methods to use child related models inside the BaseQuestion model
        # First get a list of all of the options for the question
        options_queryset = ResearchProjectOption.objects.filter(question=self).order_by('order_number')
        options_list = list(options_queryset.values('id', 'title', 'mapping', 'order_number', 'question__id'))
        # Now check each option in the list to see if there are any question option dependencies entries
        # if we do have one, add the dependant question to the sub questions list and return to the user
        sub_questions_list = ResearchProjectQuestion.get_sub_questions(self)

        # Check if there are any answers supplied, if the user profile was given, this is used when reloading the form
        user_answers_dict = dict()
        if research_project:
            user_answers = ResearchProjectAnswer.objects.filter(
                question=self, research_project=research_project
            )
            if user_answers.exists():
                user_answers = user_answers.first()
                user_answers_dict['user_answer'] = user_answers.selected_options

        return dict(
            parent_option_id=parent_option_id,
            options=options_list,
            section=self.section.id if self.section else None,
            sub_questions=sub_questions_list,
            **user_answers_dict,
            **super().to_json()  # expand the results from the to_json from the base question
        )

    @staticmethod
    def get_sub_questions(question, sub_questions_list=None):
        from engage_app.models.research_project.research_project_option import ResearchProjectOption
        if not sub_questions_list:
            sub_questions_list = []
        options_queryset = ResearchProjectOption.objects.filter(question=question)

        for option in options_queryset:
            question_option_dependency_set = ResearchProjectQuestionOptionDependency.objects.filter(
                option_id=option.id
            )
            if question_option_dependency_set.exists():
                for dependency in question_option_dependency_set:
                    sub_questions_list.append(
                        dependency.dependant_question.to_json(
                            add_sub_questions=True,
                            parent_option_id=dependency.option_id
                        )
                    )
                    ResearchProjectQuestion.get_sub_questions(dependency.dependant_question, sub_questions_list)
        return sub_questions_list

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
