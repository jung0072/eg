from base_app.models import BaseSection


class ResearchProjectSection(BaseSection):

    def get_question_json(self):
        from engage_app.models.research_project.research_project_question import ResearchProjectQuestion
        """Returns all of the questions related to this section"""
        related_questions = ResearchProjectQuestion.objects.filter(section=self)
        question_list = []
        for question in related_questions:
            question_list.append(question.to_json())

        return related_questions
