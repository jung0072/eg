import os
import json

from auth_app.models import UserProfileSection, UserProfileOption, UserProfileQuestionOptionDependency, \
    UserProfileQuestion, ResearchInterest

FORM_OUTPUT_PATH = "react_app/src/data/rendered_forms/"


def save_dict_to_json_file(dictionary, file_path):
    # First check if the directory exists, if it does not then create it
    if not os.path.exists(FORM_OUTPUT_PATH):
        os.makedirs(FORM_OUTPUT_PATH)
    # Now check if the file we want to make exists, if it does delete it
    if os.path.exists(file_path):
        os.remove(file_path)
    # Now that we have checked if the folder is there and the old file is empty we can save the new rendered form
    with open(file_path, "w+") as json_file:
        json.dump(dictionary, json_file, indent=4)
        print(f">>> The {file_path} json from the User Profile Question was successfully rendered...")


def convert_user_profile_questions_to_react_form_json():
    # First query all of the form sections that we need to render
    user_profile_sections = UserProfileSection.objects.filter(is_published=True).order_by('order_number')

    # user a list to store all of the section data json, start this list off with the injected entry for the edi information
    section_data_list = []
    for section in user_profile_sections:
        user_profile_section = UserProfileQuestion.objects.filter(section_id=section.id)
        question_data = []

        # Iterate over each question in the section, modify its values to match the rendering engine,
        for question in user_profile_section:
            rendering_type = "dynamic" if question.parent_question_id is not None else "static"
            new_data = {
                **question.to_json(),
                # TODO : dropdown, radio, checkbox, date. should be the rendered options
                "renderingType": rendering_type,
                "wrapper": "wrapper",
                "className": "question.class_name",
                "style": dict(),
                "extraOptions": dict(),
                "controlOther": [],
                "order": question.order_number,
                "isRequired": question.is_mandatory,
            }
            question_data.append(new_data)

        # save the json file
        file_path = f"{FORM_OUTPUT_PATH}{section.name.lower().replace(' ', '_').replace('/', '-')}.json"
        save_dict_to_json_file(dict(data=question_data), file_path)
        section_data_list.append(dict(**section.to_json()))

    # Finally convert the sections into one json file as well that can be used by the rendering engine to
    # render sections based on profile types
    file_path = f"{FORM_OUTPUT_PATH}section_data.json"
    save_dict_to_json_file(dict(data=section_data_list), file_path)
