from django.db import models

from base_app.models import BaseOption


class UserProfileOption(BaseOption):
    question = models.ForeignKey('UserProfileQuestion', on_delete=models.CASCADE)

    def to_json(self, add_sub_questions=False):
        extra_info = {}
        if add_sub_questions:
            dependant_question_ids = self.user_profile_dependant_option.values_list('dependant_question_id', flat=True)
            extra_info['children'] = [dependency_id for dependency_id in dependant_question_ids]
        return dict(
            question_id=str(self.question.id),
            **extra_info,
            **super().to_json()
        )
