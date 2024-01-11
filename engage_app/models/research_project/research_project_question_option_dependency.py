from django.db import models


class ResearchProjectQuestionOptionDependency(models.Model):
    id = models.AutoField(primary_key=True)
    option = models.ForeignKey(
        'ResearchProjectOption', on_delete=models.CASCADE, related_name="research_project_parent_option"
    )
    dependant_question = models.ForeignKey(
        'ResearchProjectQuestion', on_delete=models.CASCADE, related_name="research_project_dependant_question"
    )
