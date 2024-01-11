from django.core.validators import MinLengthValidator
from django.db import models
from django.utils.functional import cached_property

from base_app.models.base_engage_model import BaseEngageModel
from engage_app.utils.constants import QuestionTypes


class BaseQuestion(BaseEngageModel):
    class Meta:
        abstract = True

    dev_code = models.CharField(max_length=10, validators=[MinLengthValidator(4)], unique=True)
    order_number = models.SmallIntegerField()
    type = models.CharField(choices=QuestionTypes.to_list(), max_length=200)
    is_required_researcher = models.BooleanField(default=False)
    is_required_patient = models.BooleanField(default=False)
    is_required_family_of_patient = models.BooleanField(default=False)
    is_required_passive = models.BooleanField(default=False)
    # TODO: decide on limits with client team, for now make all fields 200 char flat limit
    text_for_researcher = models.CharField(null=True, blank=True, max_length=600)
    text_for_patient = models.CharField(null=True, blank=True, max_length=600)
    text_for_family_of_patient = models.CharField(null=True, blank=True, max_length=600)
    text_for_caretaker_of_patient = models.CharField(null=True, blank=True, max_length=600)
    text_for_passive = models.CharField(null=True, blank=True, max_length=600)
    help_text = models.TextField(null=True, blank=True)
    is_mandatory = models.BooleanField(default=False)
    display_text = models.TextField(null=True, blank=True)
    linked_to_research_interest = models.BooleanField(default=False, null=True, blank=True)
    research_interest_category = models.ForeignKey(
        'auth_app.ResearchInterestCategory', null=True, blank=True, on_delete=models.PROTECT
    )
    is_displayed_in_profile_variables = models.BooleanField(default=True, null=True, blank=True)
    is_searchable = models.BooleanField(default=True, null=True, blank=True)
    placeholder_text = models.TextField(null=True, blank=True)

    def to_json(self):
        return dict(
            id=str(self.id),
            order_number=self.order_number,
            type=QuestionTypes[self.type].value,
            is_required_researcher=self.is_required_researcher,
            is_required_patient=self.is_required_patient,
            is_required_family_of_patient=self.is_required_family_of_patient,
            is_required_passive=self.is_required_passive,
            text_for_researcher=self.text_for_researcher,
            text_for_patient=self.text_for_patient,
            text_for_family_of_patient=self.text_for_family_of_patient,
            text_for_caretaker_of_patient=self.text_for_caretaker_of_patient,
            text_for_passive=self.text_for_passive,
            help_text=self.help_text,
            dev_code=self.dev_code,
            is_displayed_in_profile_variables=self.is_displayed_in_profile_variables,
            is_searchable=self.is_searchable,
            placeholder_text=self.placeholder_text,
            display_text=self.display_text,
            linked_to_research_interest=self.linked_to_research_interest,
        )

    @cached_property
    def get_render_chan_json(self):
        return dict(
            **self.to_json(add_sub_questions=False),
            renderingType="dynamic" if self.parent_question_id is not None else "static",
            order=self.order_number,
            isRequired=self.is_mandatory,
            # Unsupported fields by the backend that can be considered in the front end
            style=dict(),
            extraOptions=dict(),
            wrapper="wrapper",
            className="question.class_name"
        )

    def get_first_question_label_set(self):
        if self.text_for_researcher and self.text_for_researcher != "":
            return self.text_for_researcher
        elif self.text_for_patient and self.text_for_patient != "":
            return self.text_for_patient
        elif self.text_for_caretaker_of_patient and self.text_for_caretaker_of_patient != "":
            return self.text_for_caretaker_of_patient
        elif self.text_for_family_of_patient and self.text_for_family_of_patient != "":
            return self.text_for_family_of_patient
        elif self.text_for_passive and self.text_for_passive != "":
            return self.text_for_passive
        else:
            return ""

    @property
    def label(self):
        """Get the display text for the question. This could either be the first text_for_* field that has text or
        if the display_text is set then return that instead"""
        if self.display_text and self.display_text != "":
            return self.display_text
        return self.get_first_question_label_set()
