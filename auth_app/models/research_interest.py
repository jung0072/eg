from django.db import models

from base_app.models import BaseCreatable, BaseApprovable
from engage_app.utils import ResearchInterestTypes
from django_select2 import forms as s2forms


class ResearchInterestsField(s2forms.ModelSelect2MultipleWidget):
    search_fields = ['title__icontains']


class ResearchInterest(BaseCreatable, BaseApprovable):
    """Research interests is sub-field of science that could apply towards any research projects or profile pages"""
    title = models.TextField(max_length=200)
    description = models.TextField(null=True, blank=False)
    mapping = models.CharField(null=True, blank=True, max_length=200)
    parent_interest = models.ForeignKey("self", null=True, on_delete=models.CASCADE)
    type = models.CharField(choices=ResearchInterestTypes.to_list(), max_length=200)
    category = models.ForeignKey("ResearchInterestCategory", on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.title

    def to_json(self, add_sub_options=False):
        extra_params_dict = dict()
        if add_sub_options:
            sub_options = ResearchInterest.objects.filter(parent_interest=self)
            extra_params_dict['options'] = [option.to_json(True) for option in sub_options]

        return dict(
            id=str(self.id),
            title=self.title,
            description=self.description,
            mapping=self.mapping,
            parent_id=self.parent_interest_id,
            type=self.category.title,
            **extra_params_dict
        )

    @classmethod
    def get_all_types(cls):
        from auth_app.models import ResearchInterestCategory
        # First get all the distinct types in the database
        categories = ResearchInterestCategory.objects.all()

        # Now iterate over each type and set the name and value in a dict to return
        return [dict(label=category.title, value=category.mapping) for category in categories]

    def delete_all_instances(self):
        from auth_app.models import UserProfileAnswer, UserProfileQuestion
        # Look for all user profile answers that are using this interest and make sure to
        # remove those from selected options. The selected option could be the id or the title or the
        # interest so be sure to check both before clearing the field
        questions = UserProfileQuestion.objects.filter(
            research_interest_category=self.category
        )
        for question in questions:
            answers = UserProfileAnswer.objects.filter(question=question)
            for answer in answers:
                if self.id in answer.selected_options:
                    answer.remove_selected_option(self.id)
                elif self.title in answer.selected_options:
                    answer.remove_selected_option(self.title)

        # Clear all research interests from any user profiles or research projects that selected this option
        # and then delete the option
        self.userprofile_set.clear()
        self.researchproject_set.clear()
        self.researchinterest_set.clear()
        self.delete()


