const userProfileFormManagementApp = {
    userProfileFormData: null,
    userProfileSections: null,
    keyedUserProfileSections: null,
    keyedUserProfileQuestions: null,
    displayedUserModel: 'QUESTION',
    // Constants for the user profile form management app
    // Current Role will be used to switch the question text that is displayed in the table
    currentRole: userRoles.PATIENT,
    questionInputList: [
        'id_is_required_patient', 'id_is_required_researcher', 'id_is_required_family_of_patient',
        'id_is_required_passive', 'id_text_for_patient', 'id_text_for_researcher', 'id_text_for_family_of_patient',
        'id_text_for_caretaker_of_patient', 'id_text_for_passive', 'id_order_number', 'id_section', 'id_type', 'id_dev_code'
    ],
    sectionInputList: [
        'id_name', 'id_order_number', 'id_is_valid_patient', 'id_is_valid_researcher', 'id_is_valid_family_of_patient',
        'id_is_valid_caretaker_of_patient', 'id_is_valid_passive', 'id_description'
    ],
    init: () => {
        // request the user profile question/ section/ system information from the backend
        userProfileFormManagementApp.requestUserProfileFormData().catch(error => console.error(error));

        // add the event listeners to the user model forms to override their submit events
        const userSectionForm = document.getElementById('user-profile-section-form');
        const userQuestionForm = document.getElementById('user-profile-question-form');
        const newUserModelButton = document.getElementById('add-user-profile-model-button');
        userSectionForm.addEventListener('submit', userProfileFormManagementApp.handleSubmitUserProfileModelForm);
        userQuestionForm.addEventListener('submit', userProfileFormManagementApp.handleSubmitUserProfileModelForm);
        newUserModelButton.addEventListener('click', userProfileFormManagementApp.clearModelFormData);

        // add on the event listeners to the radio selects to change the current user role and displayed user model
        const userRoleInputs = Array.from(document.getElementsByName('current-user-role'));
        const userProfileModelInput = Array.from(document.getElementsByName('current-user-model'));
        userRoleInputs.forEach(input => input.addEventListener(
            'click', userProfileFormManagementApp.handleSwitchCurrentUserRole)
        );
        userProfileModelInput.forEach(input => input.addEventListener(
            'click', userProfileFormManagementApp.handleSwitchDisplayedUserModel)
        );
    },
    getSectionInfo: function (sectionIdentifier) {
        return userProfileFormManagementApp.keyedUserProfileSections[sectionIdentifier];
    },
    getQuestionInfo: function (sectionIdentifier) {
        return userProfileFormManagementApp.keyedUserProfileQuestions[sectionIdentifier];
    },
    requestUserProfileFormData: async function () {
        sendFetchRequest({
            url: `/admin/user_form_data/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({user_profile_questions, user_profile_sections}) => {
                // using the user profile questions and sections json from the response we can now render the datatable
                // by default we will render the user profile questions datatable first and allow the user to switch later
                userProfileFormManagementApp.userProfileQuestions = user_profile_questions;
                userProfileFormManagementApp.userProfileSections = user_profile_sections;
                userProfileFormManagementApp.saveUserProfileData().then(
                    userProfileFormManagementApp.renderUserProfileQuestionFormHTML
                ).then(adminApp.renderDataTable);
            },
            onFail: (error) => {
                console.error("There was an error retrieving the User Profile Form Questions & Sections.", error);
            }
        });
    },
    handleSubmitUserProfileModelForm: function (submitEvent) {
        // first we need to override the form submit event by stopping the event from activating or bubbling up.
        // Then check the form attribute data-section-id or data-question-id depending on the form type to
        // see if we are creating or editing a user profile model
        submitEvent.preventDefault();
        submitEvent.stopPropagation();
        const userModelForm = submitEvent.currentTarget;
        const submittedFormType = userModelForm.getAttribute('data-form-type');
        const userModelIdentifier = userModelForm.getAttribute('data-instance-id');

        // create the formData object from the form and then append on the values for the form type and user id (if supplied)
        const userModelFormData = new FormData(userModelForm);
        const updatedRequestHeaders = {'X-USER-MODEL-FORM-TYPE': submittedFormType};
        if (userModelIdentifier) {
            // we are editing an existing user model
            updatedRequestHeaders['X-INSTANCE-ID'] = userModelIdentifier;
        }

        // now with the formData prepared, submit the form
        sendFetchRequest({
            url: `/admin/`,
            method: 'POST',
            data: userModelFormData,
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
                'Accept': 'application/json',
                ...updatedRequestHeaders
            },
            callback: (response) => {
                // TODO: If there are errors in the form then we need to parse and display them
                // close the modal and reload the data tables
                modalApp.closeAllModals();
                userProfileFormManagementApp.requestUserProfileFormData().catch(error => console.error(error));

            },
            onFail: (error) => {
                console.error("There was an error retrieving the User Profile Questions", error);
            }
        });
    },
    saveUserProfileData: async function () {
        userProfileFormManagementApp.keyedUserProfileSections = await adminApp.convertToKeyedObjectDict(
            userProfileFormManagementApp.userProfileSections
        );
        userProfileFormManagementApp.keyedUserProfileQuestions = await adminApp.convertToKeyedObjectDict(
            userProfileFormManagementApp.userProfileQuestions
        );
    },
    renderUserProfileQuestionFormHTML: async function () {
        // Using JS Interpolated strings create the table element for the user profile questions table
        let userProfileQuestionJSON = userProfileFormManagementApp.userProfileQuestions;
        const userProfileQuestionTableHeaders = adminApp.createTableRowFromArray([
            '#',
            'Question',
            'Section',
            'Type',
            'Action',
        ], 'th', 'tr', 'theme-color');
        let userProfileQuestionTableHTML = `<table id="user-profile-questions-table" class="row-border"><thead>${userProfileQuestionTableHeaders}</thead><tbody>`;

        userProfileQuestionJSON.forEach(userQuestion => {
            // destructure out the text from the user roles and then get the text based on our current user role
            const {
                text_for_family_of_patient: textForFamilyOfPatient,
                text_for_caretaker_of_patient: textForCaretakerOfPatient,
                text_for_patient: textForPatient,
                text_for_researcher: textForResearcher,
                text_for_passive: textForPassive,
            } = userQuestion;

            const userQuestionText = getQuestionTextFromUserRole(
                userProfileFormManagementApp.currentRole, textForFamilyOfPatient, textForCaretakerOfPatient,
                textForPatient, textForResearcher, textForPassive
            );

            // concatenate the table row containing the displayed user profile question data
            const userProfileQuestionTableRowHTML = adminApp.createTableRowFromArray([
                userQuestion.order_number,
                userQuestionText,
                userProfileFormManagementApp.getSectionInfo(userQuestion.section).name,
                userQuestion.type.replace('_', ' '),
                `<button type="button" name="edit-user-question-action" data-user-question-id="${userQuestion.id}"
                        onclick="userProfileFormManagementApp.handleEditUserModel(event)">Edit</button>`
            ]);

            userProfileQuestionTableHTML += userProfileQuestionTableRowHTML;
        });

        // close off the tbody and the table elements before returning the interpolated string
        userProfileQuestionTableHTML = userProfileQuestionTableHTML + "</tbody></table>";

        // make sure the user role switcher is visible before returning the html interpolated string
        document.getElementById('current-user-role-switcher').className = 'form-group';
        return userProfileQuestionTableHTML;
    },
    handleSwitchCurrentUserRole: function (mouseEvent) {
        // get the value of the current user from the clicked option and set to the adminApp, then rerender the tables
        userProfileFormManagementApp.currentRole = mouseEvent.currentTarget.value;
        if (userProfileFormManagementApp.userProfileQuestions) {
            userProfileFormManagementApp.renderUserProfileQuestionFormHTML().then(adminApp.renderDataTable);
        }
    },
    getSectionRoleValidityString: function (section) {
        // since we need to display all the user types the section is valid for destructure out those
        // attributes and convert them to a string
        let isValidForList = [];
        const {
            is_valid_researcher: isValidResearcher,
            is_valid_patient: isValidPatient,
            is_valid_family_of_patient: isValidFamilyOfPatient,
            is_valid_caretaker_of_patient: isValidCaretakerOfPatient,
            is_valid_passive: isValidPassive,
        } = section;

        if (isValidResearcher)
            isValidForList.push('Researcher');
        if (isValidPatient)
            isValidForList.push('Patient');
        if (isValidFamilyOfPatient)
            isValidForList.push('Family');
        if (isValidCaretakerOfPatient)
            isValidForList.push('Caretaker');
        if (isValidPassive)
            isValidForList.push('Passive');

        let validForString = isValidForList.join(', ');

        return validForString.substring(0, validForString.length);
    },
    displaySectionsDataTable: async function () {
        let userProfileSectionJSON = userProfileFormManagementApp.userProfileSections;
        const sectionTableHeaders = adminApp.createTableRowFromArray([
            '#',
            'Section',
            'Valid For',
            'Description',
            'Published',
            'Action',
        ], 'th', 'tr', 'theme-color');

        let userProfileQuestionTableHTML = `<table id="user-profile-questions-table" class="row-border"><thead>${sectionTableHeaders}</thead><tbody>`;

        userProfileSectionJSON.forEach(section => {
            // add the values for each section to the table interpolated string before returning
            const sectionValidityString = userProfileFormManagementApp.getSectionRoleValidityString(section);
            // if the section description is greater than 50 characters, truncate the text with an ellipses
            let sectionDescription = (section.description.length > 50)
                ? section.description.substring(0, 50) + '...'
                : section.description;

            const sectionTableRowHTML = adminApp.createTableRowFromArray([
                section.order_number,
                section.name,
                sectionValidityString,
                sectionDescription,
                section.is_published,
                `<button type="button" name="edit-section-action" data-section-id="${section.id}" onclick="userProfileFormManagementApp.handleEditUserModel(event)">Edit</button>`
            ]);

            userProfileQuestionTableHTML += sectionTableRowHTML;
        });

        // hide the user profile role switcher before returning the table
        document.getElementById('current-user-role-switcher').className = 'form-group hidden';
        return userProfileQuestionTableHTML + '</tbody></table>';
    },
    handleSwitchDisplayedUserModel: function (mouseEvent) {
        // display the questions or sections model depending on the user choice. by comparing the value from
        // from the selected radio button
        userProfileFormManagementApp.displayedUserModel = mouseEvent.currentTarget.value;


        // display the questions table or the sections table
        if (userProfileFormManagementApp.displayedUserModel === 'QUESTION') {
            userProfileFormManagementApp.renderUserProfileQuestionFormHTML().then(adminApp.renderDataTable);
        } else if (userProfileFormManagementApp.displayedUserModel === 'SECTION') {
            userProfileFormManagementApp.displaySectionsDataTable().then(adminApp.renderDataTable);
        }
    },
    handleEditUserModel: function (mouseEvent) {
        // using the data-section/question-id prop of the button that was clicked, load the values of the section/question
        // into the section form from the adminApp. Check which type of button was clicked based on the attribute data-section-id.
        // After getting a reference to the object clicked, load its user model data into the user model modal and then click
        // both button to open the modal
        let userModelData;
        let userModelIdentifier;
        let modalTabButton;

        const modalButton = document.querySelector('button[data-trigger="customize-user-profile-form-modal"]');
        if (mouseEvent.currentTarget.hasAttribute('data-section-id')) {
            userModelIdentifier = mouseEvent.currentTarget.getAttribute('data-section-id');
            userModelData = userProfileFormManagementApp.getSectionInfo(userModelIdentifier);
            userProfileFormManagementApp.loadSectionDetails(userModelData);

            // get a reference to the modal button to click and display the modal to the user and
            modalTabButton = document.querySelector('li[data-tab="user-profile-section-tab"]');
        } else {
            userModelIdentifier = mouseEvent.currentTarget.getAttribute('data-user-question-id');
            userModelData = userProfileFormManagementApp.getQuestionInfo(userModelIdentifier);
            userProfileFormManagementApp.loadQuestionDetails(userModelData);
            modalTabButton = document.querySelector('li[data-tab="user-profile-question-tab"]');
        }

        if (!userModelData) {
            return;
        }
        // remove the event listener for the clear modal event before clicking the modal, and rebind after
        modalButton.removeEventListener('click', userProfileFormManagementApp.clearModelFormData);
        modalButton.click();
        modalButton.addEventListener('click', userProfileFormManagementApp.clearModelFormData);

        modalTabButton.click();  // switch to the question/ section tab

        // ready any changes necessary to send this info to the server
    },
    loadSectionDetails: function (section) {
        // load the details of the supplied section into the section edit modal
        document.getElementById('user-profile-section-form').setAttribute(
            'data-instance-id', section.id
        );
        userProfileFormManagementApp.loadModalFormData(userProfileFormManagementApp.sectionInputList, section);
    },
    loadQuestionDetails: function (question) {
        document.getElementById('user-profile-question-form').setAttribute(
            'data-instance-id', question.id
        );
        userProfileFormManagementApp.loadModalFormData(userProfileFormManagementApp.questionInputList, question);
    },
    clearModelFormData: function (clickEvent) {
        // using a combined array of both of the form input list, clear the values set in each input and remove the
        // data instance id attribute from both forms
        const userModelForms = ['user-profile-section-form', 'user-profile-question-form'];

        userModelForms.forEach(formId => {
            const formNode = document.getElementById(formId);
            formNode.reset();
            formNode.setAttribute('data-instance-id', '');
        });
    },
    loadModalFormData: (inputList, userModelData) => {
        //loop over each input id and then set the value to corresponding key in the supplied user model data
        inputList.forEach(input => {
            const modelFormInput = document.getElementById(input);
            // check if it is has a checked attribute. If it does, set checked to value from the section/ question attribute
            const sectionValue = userModelData[input.substring(3, input.length)];
            if (modelFormInput.type === 'checkbox') {
                modelFormInput.checked = sectionValue;
            } else {
                modelFormInput.value = sectionValue;
            }
        });
    },
}

document.addEventListener('DOMContentLoaded', userProfileFormManagementApp.init.bind(userProfileFormManagementApp))
