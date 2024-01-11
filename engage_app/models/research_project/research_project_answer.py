from django.db import models
from base_app.models import BaseAnswer


class ResearchProjectAnswer(BaseAnswer):
    """For each user profile answer object we will have a reference to the question that was saved and the selected
    options"""
    question = models.ForeignKey(
        'ResearchProjectQuestion', on_delete=models.CASCADE, related_name="research_project_answered_question"
    )
    research_project = models.ForeignKey('ResearchProject', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('question', 'research_project')

    def to_json(self):
        option = self.selected_options
        if self.question.type in ['RADIO_BUTTON', 'RADIO_BUTTON_CIRCLE', 'RADIO_BUTTON_BOX']:
            option = self.selected_options[0]
        return dict(
            question_text=self.question.to_json(['text_for_researcher']),
            selected_options=option,
            comment=self.comment,
            id=str(self.id),
            question_id=self.question_id
        )
