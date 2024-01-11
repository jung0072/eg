from django.db import models
from base_app.models import BaseAnswer


class UserProfileAnswer(BaseAnswer):
    """For each user profile answer object we will have a reference to the question that was saved and the selected
    options"""
    question = models.ForeignKey(
        'UserProfileQuestion', on_delete=models.CASCADE, related_name="user_profile_answered_question"
    )
    user_profile = models.ForeignKey('UserProfile', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('question', 'user_profile')

    def to_json(self):
        from auth_app.models.research_interest import ResearchInterest
        from engage_app.utils import QuestionTypes

        # If the parent question is linked to research interests, then display the title for those options
        selected_options_list = None
        if self.question.linked_to_research_interest:
            validated_options_list = [num.isdigit() for num in self.selected_options]
            if all(validated_options_list):
                selected_options_list = list(
                    ResearchInterest.objects.filter(id__in=self.selected_options).values_list('title', flat=True)
                )
            else:
                selected_options_list = self.selected_options

        return dict(
            question_text=self.user_profile.get_question_text(self.question),
            selected_options=selected_options_list or self.get_options_list(),
            comment=self.comment,
            label=self.question.label,
            section=self.question.section.name,
            is_weblink=self.question.type == QuestionTypes.URL.name
        )

    def get_options_list(self):
        """Return the option label and value for the selected options for this question"""
        from auth_app.models.user_profile.user_profile_option import UserProfileOption
        from engage_app.utils import QuestionTypes
        options = UserProfileOption.objects.filter(question=self.question)

        # If we have the date type specified, only return the year portion of the date
        if self.question.type == QuestionTypes.DATE_PICKER_YEAR.name:
            return [self.selected_options[0][0:4]] if self.selected_options and self.selected_options[0] is not None else ''
        if self.question.type == QuestionTypes.DATE_PICKER.name:
            return [self.selected_options[0][0:10]] if self.selected_options and self.selected_options[0]  else ''

        options_list = []
        not_found_option_list = [*self.selected_options]
        for selection in self.selected_options:
            for option in options:
                if option.title == selection or option.mapping == selection:
                    if option.mapping != "other<free_text>":
                        options_list.append(option.title or option.mapping)
                        not_found_option_list = list(filter(lambda x: x != selection, not_found_option_list))
                    continue
        options_list.extend(not_found_option_list)
        return options_list

    def remove_selected_option(self, option):
        self.selected_options.remove(option)
        self.save()
