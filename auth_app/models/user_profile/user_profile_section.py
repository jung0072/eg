from base_app.models import BaseSection


class UserProfileSection(BaseSection):

    def get_question_json(self):
        from auth_app.models.user_profile.user_profile_question import UserProfileQuestion
        """Returns all of the questions related to this section"""
        related_questions = UserProfileQuestion.objects.filter(section=self)
        question_list = []
        for question in related_questions:
            question_list.append(question.to_json())

        return related_questions

    def to_json(self):
        return super().to_json()
