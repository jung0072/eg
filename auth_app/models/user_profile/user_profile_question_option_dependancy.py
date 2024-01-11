from django.db import models


class UserProfileQuestionOptionDependency(models.Model):
    id = models.AutoField(primary_key=True)
    option = models.ForeignKey(
        'UserProfileOption', on_delete=models.CASCADE, related_name="user_profile_dependant_option"
    )
    dependant_question = models.ForeignKey(
        'UserProfileQuestion', on_delete=models.CASCADE, related_name="user_profile_dependant_question"
    )
