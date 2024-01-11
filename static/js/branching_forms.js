class BranchingFormsApp {

    // Static properties that will not change based on the instance
    static backButtonIdentifier = 'previous-form-section-button';
    static nextButtonIdentifier = 'next-form-section-button';

    constructor(
        {
            formNodeId,
            formNavNodeId,
            userId,
            formDataURL,
            submissionURL,
            submissionRedirectURL,
            injectedFormNodeIdentifier,
            progressBarID = ''
        }
    ) {
        this.formNodeIdentifier = formNodeId;
        this.formNavNodeIdentifier = formNavNodeId;
        this.injectedFormNodeIdentifier = injectedFormNodeIdentifier;
        this.userIdentifier = userId;

        // fields for specific form mappings
        this.PCC = "pediatric_critical_care";
        this.PEM = "pediatric_emergency_medicine";
        this.IFD = "infectious_disease";
        this.clinicalAreas = [
            this.PCC,
            this.PEM,
            this.IFD,
        ];

        // TODO: Add fields for the request urls to this section of the constructor
        this.formDataURL = formDataURL;
        this.submissionURL = submissionURL;
        this.submissionRedirectURL = submissionRedirectURL;

        if (progressBarID) {
            this.useProgressBar = true;
            this.progressBarNode = document.getElementById(progressBarID);
            this.completedQuestionCount = 0;
            this.questionCount = 0;
        }

    }

    // Must call this function before using the branching forms application, this is where make any requests needed
    // from the backend here before using this application
    async initialize() {
        // There was stuff here. Then it got removed. Leaving this function here in case it's still needed later.
    }

    // must set form node id and form nav node id before using any of the branching forms app
    requestBranchingPathForms() {
        if (!this.formNodeIdentifier || !this.formNavNodeIdentifier) {
            throw new Error("Branching Forms Application needs the node id for the form container and the form navigation");
        }

        // before making the request, delete everything inside of the form and show the loader
        const formContainer = document.getElementById(this.formNodeIdentifier);
        formContainer.innerHTML = BranchingFormsApp.createSpinnerHTMLString();

        const requestURL = this.formDataURL;
        // first request the JSON values of the user profile form
        sendFetchRequest({
            url: requestURL,
            method: 'GET',
            headers: {},
            callback: ({ sections, questions, role: currentUserRole }) => {
                this.buildUserProfileSections(sections, currentUserRole);
                this.questionList = questions;
                questions.forEach(question => this.buildFormElement(question, currentUserRole).then(subQuestions => {
                    // after creating the question, create any sub questions if present
                    if (subQuestions && subQuestions.length > 0) {
                        const { section } = question;
                        subQuestions.forEach(subQuestion => {
                            this.buildFormElement({ ...subQuestion, section }, currentUserRole, 'hidden sub-question');
                        });
                    }

                    // now sort each sections questions based on id and then re-append the children in the proper order
                    const sectionList = Array.from(document.querySelectorAll('.user-profile-section'));
                    sectionList.forEach(sectionNode => {
                        // get all of the divs with a data order number from the section, sort them into a new list and replace
                        // we will ignore any questions with a data-order-number that is because those questions are edge case sub-questions
                        const questionDivs = Array.from(sectionNode.querySelectorAll('[data-order-number]:not([data-order-number="0"])'));
                        questionDivs.sort((a, b) => {
                            let comparisonA = parseInt(a.getAttribute('data-order-number'));
                            let comparisonB = parseInt(b.getAttribute('data-order-number'));
                            return (comparisonA < comparisonB) ? -1 : (comparisonA > comparisonB) ? 1 : 0;
                        });

                        // with the sorted question divs, add each to the orderList and then return to the section Node
                        sectionNode.innerHTML = "";
                        questionDivs.forEach(div => sectionNode.appendChild(div));
                    });
                    // one all of the items have been appended to the dom, check for active sub questions to display

                }).then(function()
                {
                    BranchingFormsApp.displayActiveSubQuestions()

                    // We're all finished loading, go ahead and init the ajax_select fields
                    $('.django-select2').djangoSelect2();
                }).catch(
                    err => console.error("There was an error building the form elements", err)
                ));

                // using the number of parent question and if we are using a progressBar prepare the progress bar element
                if (this.useProgressBar) {
                    this.questionCount = questions.length;
                    BranchingFormsApp.updateProgressBarNode(
                        this.progressBarNode,
                        "submit-user-profile-for-review-button",
                        this.questionCount
                    );
                }
            },
            onFail: (error) => {
                console.error("There was an error retrieving the Form Questions", error);
            }
        });

        // after requesting the form clear out the form container and build the form elements
        // loop through all of the received question in JS and build the form element based on the type
    }

    requestCanadianCities(callback) {
        sendFetchRequest({
            url: `/api/data/cities/`,
            method: 'GET',
            headers: {},
            callback,
            onFail: (error) => {
                console.error("There was an error retrieving the Canadian cities list.", error);
            }
        });
    }

    // upon creation of this object, request the research interests from the backend and store them in a keyed object
    async requestResearchInterests(callback) {
        await sendFetchRequest({
            url: `/app/research_interests/`,
            method: 'GET',
            headers: {},
            callback,
            onFail: (error) => {
                console.error("There was an error retrieving the Research Interests.", error);
            }
        });
    }

    // This is the function that we use to build the different sections of the form
    buildUserProfileSections(userProfileSections, currentUserRole) {
        const formContainer = document.getElementById(this.formNodeIdentifier);
        formContainer.setAttribute('data-redirect-url', this.submissionRedirectURL);
        formContainer.setAttribute('data-submit-url', this.submissionURL);
        const userProfileSectionNav = document.getElementById(this.formNavNodeIdentifier);

        // wipe out the contents of the form container and generate the user profile sections
        // repeat the same process, but for the user profile nav elements as well
        formContainer.innerHTML = "";
        userProfileSectionNav.innerHTML = "";

        // if we have an injected form node, manually inject the form section based on its attributes
        const injectedFormNodeTemplate = (this.injectedFormNodeIdentifier)
            ? document.getElementById(this.injectedFormNodeIdentifier)
            : null;

        if (injectedFormNodeTemplate) {
            // first add the form section container
            formContainer.innerHTML += `
                <div id="${injectedFormNodeTemplate.id}-section" class="user-profile-section injected-form-section">
                    <h1 class="text-centre">${injectedFormNodeTemplate.getAttribute('data-form-section-name')}</h1>
                    <p class="text-centre">${injectedFormNodeTemplate.getAttribute('data-form-section-description')}</p>
                    ${injectedFormNodeTemplate.innerHTML}
                </div>
            `;

            // then manually add the profile circle nav button
            userProfileSectionNav.innerHTML += `
                <li class="user-profile-section-nav-item active"
                    data-section-id="${injectedFormNodeTemplate.id}-section"
                    >
                    <div data-order-number="0">
                        <div class="circle active" onclick="BranchingFormsApp.handleSectionNavClick(event)"
                            data-section-id="${injectedFormNodeTemplate.id}-section"
                        ></div>
                        <p class="text-centre">${injectedFormNodeTemplate.getAttribute('data-form-section-name')}</p>
                    </div>
                </li>
            `;
        }

        // now loop through any remaining sections returned in the response
        for (let [index, section] of userProfileSections.entries()) {
            formContainer.innerHTML += `
                <div id="${section.id}" class="user-profile-section ${(index + 1 === 0) ? '' : 'hidden'}">
                    <h1 class="text-centre">${section.name}</h1>
                    <p class="text-centre">${section.description}</p>
                </div>
            `;
            userProfileSectionNav.innerHTML += `
                <li class="user-profile-section-nav-item ${(index === userProfileSections.length - 1) ? 'last' : ''} ${(index + 1 === 0) ? 'active' : ''}"" 
                    data-section-id="${section.id}"
                    >
                    <div data-order-number="0">
                        <div class="circle ${(index + 1 === 0) ? 'active' : ''}" onclick="BranchingFormsApp.handleSectionNavClick(event)"
                            data-section-id="${section.id}"
                        ></div>
                        <p class="text-centre">${section.name}</p>
                    </div>
                    
                    
                </li>
            `;
            // removed line class
            //<div class="${(index === userProfileSections.length - 1) ? '' : 'connecting-circle-line'}" />
        }

        // TODO: Check if the researcher is still pending for review or not, once accepted they shouldn't see this btn
        const submitForReviewBtn = (currentUserRole === userRoles.RESEARCHER)
            ? `
            <button id="submit-user-profile-for-review-button" class="button action active" type="Submit"
                data-form-node="${this.formNodeIdentifier}" data-user-id="${this.userIdentifier}"
                data-submit-for-review="true"
                onclick="BranchingFormsApp.handleSubmitUserProfileForm(event)" disabled
            >
                Submit for Review
            </button>`
            : '';

        if (currentUserRole === userRoles.RESEARCHER) {
            this.submitForReviewButtonId = 'submit-user-profile-for-review-button';
        }

        // once everything is finished, add the loaded class list to show the bar in-between the circle icons and add
        // the submit button to the formContainer
        userProfileSectionNav.classList.add('loaded');
        formContainer.appendChild(navigationApp.convertStringToHTML(`
            <div class="branching-form-btn-container">
                <button id="${BranchingFormsApp.backButtonIdentifier}" class="button action active" type="button"
                    data-section-change="-1"
                    onclick="BranchingFormsApp.handleNextSectionClick(event)" disabled
                >
                    Back
                </button>
                <button id="${BranchingFormsApp.nextButtonIdentifier}" class="button action active main" type="button"
                    data-section-change="1"
                    onclick="BranchingFormsApp.handleNextSectionClick(event)"
                >
                    Next
                </button>
                <button id="submit-user-profile-form-button" class="button action active main" type="Submit"
                    data-form-node="${this.formNodeIdentifier}" data-user-id="${this.userIdentifier}"
                    onclick="BranchingFormsApp.handleSubmitUserProfileForm(event)"
                >
                    Save
                </button>
                ${submitForReviewBtn}
            </div>
        `));
    }

    async buildFormElement(question, currentUserRole, customSelector = '') {
        const {
            sub_questions,
            text_for_family_of_patient,
            text_for_caretaker_of_patient,
            text_for_patient,
            text_for_researcher,
            text_for_passive,
            order_number,
            section: section_id,
            parent_option_id,
            user_answer
        } = question;

        const questionText = this.getQuestionTextFromUserRole(
            currentUserRole, text_for_family_of_patient, text_for_caretaker_of_patient, text_for_patient, text_for_researcher, text_for_passive
        );
        let questionHTMLString = null;

        if (user_answer && user_answer[0] !== '' && this.useProgressBar) {
            this.completedQuestionCount++;
        }

        switch (question.type) {
            case questionTypes.TEXT:
                questionHTMLString = this.buildTextInput(question, questionText, customSelector);
                break;
            case questionTypes.MULTI_TEXT:
                questionHTMLString = this.buildMultiTextInput(question, questionText, customSelector);
                break;
            case questionTypes.NUMBER:
                questionHTMLString = this.buildNumberInput(question, questionText, customSelector);
                break;
            case questionTypes.DATE:
                questionHTMLString = this.buildDateInput(question, questionText, customSelector);
                break;
            case questionTypes.SINGLE:
                questionHTMLString = this.buildSingleChoiceInput(question, questionText, customSelector);
                break;
            case questionTypes.PARAGRAPH:
                questionHTMLString = this.buildFreeTextInput(question, questionText, customSelector);
                break;
            case questionTypes.TRUE_OR_FALSE:
                questionHTMLString = this.buildTrueOrFalseInput(question, questionText, customSelector);
                break;
            case questionTypes.SELECT:
                questionHTMLString = this.buildSelectInput(question, questionText, customSelector);
                break;
            case questionTypes.SELECT_LARGE:
                questionHTMLString = this.buildSelectInput(question, questionText, `${customSelector} select-large`);
                break;
            case questionTypes.SELECT_PRIMARY:
                // TODO: allow users to specify order of submitted items by selecting primary options
                questionHTMLString = this.buildSelectInput(question, questionText, customSelector);
                break;
            case questionTypes.TEXT_OR_NA:
                console.warn("Question Type not yet Supported:", question.type);
                break;
            case questionTypes.SECTION_SELECT:
                questionHTMLString = this.buildSectionSelectInput(question, questionText, customSelector);
                break;
            default:
                console.error('This is not a proper question type', question.type);
        }

        // supply the parent question section id if it is supplied with the question otherwise give nothing
        this.appendQuestionToSection(
            questionHTMLString,
            order_number,
            section_id,
            parent_option_id,
            (question.parentQuestion) ? question.parentQuestion.section : null,
            question,
            (question.overrideNodeId) ? question.overrideNodeId : null
        );

        // map the parent questions onto each sub question to get a reference to the parent attributes
        return sub_questions.map(subQuestion => {
            // add a reference to the parent question to the newly mapped sub questions
            subQuestion.parentQuestion = question;

            // if we are creating a section select, we will want to use an override node to show all of the sub
            // questions inside the fieldset container and then we can use the buildSectionSelectInput to get the html string
            if (question.type === questionTypes.SECTION_SELECT) {
                subQuestion.overrideNodeId = `${question.id}-fieldset`;
            }
            return subQuestion;
        });
    }

    buildSingleChoiceInput({ options, id, user_answer }, questionText, customSelector) {
        // Now using an HTML Formatted Multi Line Interpolated String, build the Multiple Choice Input and append to the section
        const optionsHTML = this.buildSingleChoiceOptions(options, id, user_answer);
        // TODO: look into why the id is only showing up sometimes
        return `
        <div class="form-group ${customSelector}" id="${id}-container">
            <label for="${id}">${questionText}</label>
            <select class="select-single-input" name="${id}" id="${id}" 
                ${(customSelector.includes('hidden')) ? 'disabled' : ''}
                onchange="BranchingFormsApp.handleOptionChangeEvent(event)"
                onclick="BranchingFormsApp.handleOptionClickEvent(event)"
            >
                ${optionsHTML}
            </select>
        </div>
        `;
    }

    buildSingleChoiceOptions(options, questionID, userAnswer) {
        // start off with a default option that cannot be selected and has no value and ignored in form events
        let optionsHTML = '<option hidden disabled selected value> -- select an option -- </option>';

        if (options[0].title === "Canadian Cities") {
            // If we are building the canadian cities list, request the canadian cities from the backend and then
            // create the options using formatted HTML strings
            this.requestCanadianCities(async ({ canadian_cities }) => {
                canadian_cities.forEach(city => {
                    const userAnswerSelection = (userAnswer && userAnswer !== '' && userAnswer[0] === city.name)
                        ? 'selected'
                        : '';
                    optionsHTML += `<option id="${city.id}" value="${city.name}" ${userAnswerSelection}>${city.name}</option>`;
                });
                this.appendOptionsToQuestion(questionID, optionsHTML);
            });

        } else {
            // if we are building a normal option loop over each option and if it
            options.forEach(opt => {
                // check if the current option is the selected answer from the current option also check if there is
                // an option, if none use an empty string
                const userAnswerSelection = (userAnswer && userAnswer !== '' && (userAnswer[0] === opt.title || userAnswer.findIndex(answer => answer === opt.title) > -1))
                    ? 'selected'
                    : '';
                const optionMapping = (opt.mapping) ? opt.mapping : '';
                optionsHTML += `<option id="${opt.id}" value="${opt.title}" ${userAnswerSelection} data-option-mapping="${optionMapping}">
                                    ${opt.title}
                                </option>`;
            });
        }
        return optionsHTML;
    }

    buildTextInput({ options, id, user_answer }, questionText, customSelector) {
        // Now using an HTML Formatted Multi Line Interpolated String, build the text input descriptions options (in a datalist)
        let optionsHTMLString = `<datalist id="${id}-datalist">`;
        options.forEach(opt => optionsHTMLString += `\n\t<option value="${opt.title}">`);
        optionsHTMLString += '</datalist>';

        const userAnswerAttribute = (user_answer && user_answer !== "") ? `value="${user_answer}"` : '';

        // create the textInput interpolated string
        return `
        <div class="form-group ${customSelector}" id="${id}-container">
            <label for="${id}">${questionText}</label>
            <input type="text" name="${id}" id="${id}" list="${id}-datalist" ${userAnswerAttribute}>
            ${optionsHTMLString}
        </div>
        `;
    }

    buildMultiTextInput({ id, user_answer }, questionText, customSelector) {
        const userAnswerText = (user_answer && user_answer !== "")
            ? `${user_answer}`
            : '';

        return `
        <div class="form-group ${customSelector}" id="${id}-container">
            <label for="${id}">${questionText}</label>
            <textarea style="resize: none;" id="${id}" name="${id}" rows="3">${userAnswerText}</textarea>
            <button type="button" class="" data-text-box-count="3" data-parent="" onclick="BranchingFormsApp.handleExpandTextBox(event)">
                Add
            </button>
        </div>
        `;
    }

    static handleExpandTextBox(clickEvent) {
        // add 3 rows to the multi text text box, if it has reached 9 rows then disable the add button and remove
        // the click event
        clickEvent.stopPropagation();
        let currentTextBoxCount = parseInt(clickEvent.currentTarget.getAttribute('data-text-box-count'));

        if (currentTextBoxCount < 9) {
            currentTextBoxCount = currentTextBoxCount + 3;
            clickEvent.currentTarget.previousElementSibling.rows = currentTextBoxCount;
            clickEvent.currentTarget.setAttribute('data-text-box-count', currentTextBoxCount);
        }
        if (currentTextBoxCount >= 9) {
            clickEvent.currentTarget.disabled = true;
            clickEvent.currentTarget.removeEventListener('click', BranchingFormsApp.handleExpandTextBox);
        }

    }

    buildNumberInput({ id, user_answer }, questionText, customSelector) {
        // get the user answer value from the first value in the array, otherwise return an empty string
        let userAnswerText = (user_answer && user_answer !== "")
            ? `${user_answer[0]}`
            : '';

        return `
        <div class="form-group ${customSelector}" id="${id}-container">
            <label for="${id}">${questionText}</label>
            <input class="number-input" type="number" name="${id}" id="${id}" value="${userAnswerText}">
        </div>
        `;
    }

    buildDateInput({ id, user_answer }, questionText, customSelector) {
        // get the user answer value from the first value in the array, otherwise return an empty string
        let userAnswerText = (user_answer && user_answer !== "")
            ? `${user_answer[0]}`
            : '';

        return `
        <div class="form-group ${customSelector}" id="${id}-container">
            <label for="${id}">${questionText}</label>
            <input class="date-input" type="date" name="${id}" id="${id}" value="${userAnswerText}">
        </div>
        `;
    }

    buildFreeTextInput({ id, user_answer }, questionText, customSelector) {
        // Check if there is a user answer and add that to the text area
        let userAnswerText = (user_answer && user_answer !== "")
            ? `${user_answer[0]}`
            : '';

        // BUGFIX: to check if we are supplied an empty string array from the backend
        // userAnswerText = (userAnswerText === "\"") ? '' : userAnswerText;
        // return the formatted string for the text area
        return `
        <div class="form-group ${customSelector}" id="${id}-container">
            <label for="${id}">${questionText}</label>
            <textarea id="${id}" name="${id}" rows="6" style="resize: none;">${userAnswerText}</textarea>
        </div>`;
    }

    // may not create because of the way that we have structure sub questions in the system to trigger on options
    // TODO: create a type of form input to display the values true or false
    buildTrueOrFalseInput(question, questionText, customSelector) {

    }

    buildSelectInput({ options, id, user_answer, parent_option_id, type }, questionText, customSelector) {
        // // create the parent option attribute if the id was supplied
        // const parentOptionAttribute = (parent_option_id) ? `data-parent-option="${parent_option_id}"` : '';
        // Now using an HTML Formatted Multi Line Interpolated String, build the select all that apply input
        let optionsHTML = '<div class="scrollable-select-multiple-input">';
        optionsHTML += this.buildSelectOptions(options, id, user_answer);
        optionsHTML += "</div>";  // close off the container div of the scrollable-select-multiple-input

        // returned an interpolated string of an html div with all of the options html as the child element
        return `
        <div class="form-group select-multiple-input ${customSelector}" id="${id}-container"
            data-question-type="${type}"
        >
            <label for="${id}">${questionText}</label>
            ${optionsHTML}
        </div>
        `;
    }

    buildSelectOptions(optionsData, questionID, userAnswer) {
        let optionsHTMLString = "";
        let otherOptionTextBox = "";
        let userAnswerValue = null;
        optionsData.forEach(opt => {
            // check if the user answer was checked or not
            let userAnswerCheckedVal = '';
            if (userAnswer && userAnswer !== '' && Array.isArray(userAnswer)) {
                // check if the opt title is in the array or if it has the data mapping of 'other<free_text>'
                if (userAnswer?.indexOf(opt.title) > -1) {
                    userAnswerCheckedVal = 'checked';
                } else if (opt.mapping === 'other<free_text>' && userAnswer.length > 0) {
                    // since we have a user answer, we can open the text box and display the answer inside to the user
                    userAnswerCheckedVal = 'checked';
                    otherOptionTextBox = "\n" + BranchingFormsApp.createOtherOptionTextBox(
                        questionID, null, true, opt.id, userAnswer
                    );
                }
            }
            // check if the option mapping is one of the defined clinical areas in the research interests object
            // and if it is, create options using the predefined items recursively
            if (opt.mapping in this.researchInterests) {
                optionsHTMLString += this.buildSelectOptions(
                    this.researchInterests[opt.mapping], questionID, userAnswer
                );
            } else {
                // concatenate the option value, using an IIFE inline function we can append the string for the
                // other options text box only if it is supplied, otherwise we will not render anything
                optionsHTMLString += `
                    <div class="form-checkbox form-options" id="${opt.id}-option">
                        <input type="checkbox" name="${questionID}" id="${opt.id}" value="${opt.title}" ${userAnswerCheckedVal}
                            data-option-mapping="${(opt.mapping) ? opt.mapping : ''}"
                            class="select-multiple-option"
                            onclick="BranchingFormsApp.handleOptionClickEvent(event)"
                            onchange="BranchingFormsApp.handleOptionChangeEvent(event)"
                             />
                        <label for="${opt.id}">${opt.title}</label> ${otherOptionTextBox}
                    </div>
                    `;
            }

        });

        return optionsHTMLString;
    }

    buildSectionSelectInput(question, questionText, customSelector) {
        // First create a single choice input, then modify the returned html string to add a field set to the bottom
        // of the container and then return the html string
        const sectionSelectHTMLString = this.buildSingleChoiceInput(question, questionText, `${customSelector} section-select-input`);
        // const sectionSelectFieldSet = `<fieldset id="${question.id}-fieldset"></fieldset></div>`;

        // TODO: find out why section select questions wont append to the fieldset
        const sectionSelectFieldSet = `</div>`;
        return sectionSelectHTMLString.replace('</div>', sectionSelectFieldSet);
    }

    getQuestionTextFromUserRole(
        userRole, textForFamilyOfPatient, textForCaretakerOfPatient, textForPatient, textForResearcher, textForPassive
    ) {

        switch (userRole) {
            case userRoles.CARETAKER:
                return textForCaretakerOfPatient;
            case userRoles.FAMILY_OF_PATIENT:
                return textForFamilyOfPatient;
            case userRoles.RESEARCHER:
                return textForResearcher;
            case userRoles.PATIENT:
                return textForPatient;
            case userRoles.PASSIVE:
                return textForPassive;
            default:
                console.error('This user role is not supported, please contact your admin', userRole);
        }
    }

    insertQuestionIntoForm(orderNumber, parentNode, questionNode) {
        // If no order number was supplied, default to insert at the beginning
        if (!orderNumber) orderNumber = 1;
        orderNumber = orderNumber - 1;

        if (this.useProgressBar) {
            questionNode.addEventListener('input', BranchingFormsApp.updateProgressBarEvent);
            questionNode.setAttribute('data-progress-bar', this.progressBarNode.id);
            questionNode.setAttribute('data-initial-value', (questionNode.children.length > 1) ? questionNode.children[1].value : '');
            questionNode.setAttribute('data-submit-for-review-button', this.submitForReviewButtonId);
        }

        // get the count of form groups currently inside the section, using that count, place the question in the proper
        // location within its section or near to its parent question
        const parentNodeFormGroupCount = parentNode.querySelectorAll('.form-group').length;
        if (orderNumber >= parentNodeFormGroupCount) {
            parentNode.appendChild(questionNode);
        } else {
            // insert the child form group into its proper position, subtract 2 for the header and description text nodes
            parentNode.insertBefore(questionNode, parentNode.children[orderNumber + 2]);
        }
    }

    appendQuestionToSection(
        questionHTMLString, orderNumber, sectionIdentifier, parentOptionIdentifier = null,
        parentSection = null, questionJSON, overrideNodeIdentifier = null
    ) {
        const questionHTML = navigationApp.convertStringToHTML(questionHTMLString);
        questionHTML.setAttribute('data-order-number', orderNumber);
        questionHTML.setAttribute('data-section-code', sectionIdentifier);
        questionHTML.setAttribute('data-user-answer', (questionJSON?.user_answer) ? questionJSON?.user_answer[0] : '');

        // if this is not a sub question, add a progress badge to the question
        if (!questionHTML.classList.contains('sub-question') && this.useProgressBar) {
            questionHTML.appendChild(BranchingFormsApp.createProgressBadge(false));
        }

        // if we have an overrideNodeIdentifier then we can get the get the node and insert the question into the specified node
        if (overrideNodeIdentifier) {
            const overrideNode = document.getElementById(overrideNodeIdentifier);
            if (overrideNode) {
                this.insertQuestionIntoForm(orderNumber, overrideNode, questionHTML);
            } else {
                console.warn(`Could not find the specified override node for Question #${orderNumber} in Section #${sectionIdentifier} | ID: ${overrideNodeIdentifier}`);
            }
        }

        // after creating the question HTML, get the parent node for the question, if the parent option is given
        // and its in the same section as the question, append it to that section, if not append it to its own section
        let parentNode;
        if (parentOptionIdentifier && parentSection === sectionIdentifier) {
            questionHTML.setAttribute('data-parent-question', questionJSON?.parentQuestion?.id);
            questionHTML.setAttribute('data-parent-option', parentOptionIdentifier);
            parentNode = document.getElementById(`${parentOptionIdentifier}-option`);
        } else {
            parentNode = document.getElementById(sectionIdentifier);
        }

        if (parentNode) {
            this.insertQuestionIntoForm(orderNumber, parentNode, questionHTML);
        } else {
            // if there is no parent node, the question may be a single choice option, in this case we want to append
            // the question to the correct User Profile Section
            parentNode = document.getElementById(sectionIdentifier);
            if (parentNode) {
                this.insertQuestionIntoForm(orderNumber, parentNode, questionHTML);
            } else {
                // console.info(sectionIdentifier, parentOptionIdentifier, questionHTML, parentNode, document.getElementById(parentOptionIdentifier));
                console.warn("no parent node found", sectionIdentifier, parentOptionIdentifier, questionHTML);
            }
        }
    }

    appendOptionsToQuestion(questionNodeId, optionsHTMLString) {
        const questionNode = document.getElementById(questionNodeId);
        const optionsHTMLCollection = Array.from(navigationApp.convertStringToHTML(optionsHTMLString));
        optionsHTMLCollection.forEach(option => questionNode.appendChild(option));
    }

    static updateProgressBarEvent(inputEvent) {
        // check if a sub-question was updated, then we do not need to update the progress bar
        if (!inputEvent.currentTarget.classList.contains('sub-question') && !inputEvent.currentTarget.parentNode.classList.contains('sub-question')) {
            // a function to update the progress bar if we are using one in the branching forms application
            let progressBarID = inputEvent.currentTarget.getAttribute('data-progress-bar');
            const progressBarNode = document.getElementById(progressBarID);
            const submitForReviewBtnId = inputEvent.currentTarget.getAttribute('data-submit-for-review-button');
            BranchingFormsApp.updateProgressBarNode(progressBarNode, submitForReviewBtnId);
        }
    }

    static updateProgressBarNode(progressBarContainerNode, submitForReviewBtnId, questionCount = null) {
        // first make sure the progress bar is not hidden (as it is by default)
        progressBarContainerNode.classList = 'progress-container';
        const progressBarStatus = BranchingFormsApp.getProgressBarStatus();
        const completedQuestionCount = progressBarStatus.completedQuestionCount;
        const questionInputs = progressBarStatus.questionInputs;

        // update the progress bar node and check if the submit for review button is ready to disable and submit
        if (questionCount) {
            BranchingFormsApp.updateProgressBarTotalValue(progressBarContainerNode, questionCount);
        }
        BranchingFormsApp.updateProgressBarCurrentValue(progressBarContainerNode, completedQuestionCount);
        BranchingFormsApp.updateSubmitForReviewButton(
            completedQuestionCount,
            questionInputs,
            submitForReviewBtnId
        );
    }

    static updateProgressBarCurrentValue(progressBarContainerNode, completedQuestionCount) {
        // first get a reference to the progress bar node and the progress bar label
        const progressBarNode = progressBarContainerNode.querySelector('.progress-bar');
        const progressBarLabel = progressBarContainerNode.querySelector('.progress-bar-label');

        // get the total question count from the progress bar node
        const totalQuestionCount = Number.parseInt(progressBarNode.getAttribute('aria-valuemax'));

        // calculate the percentage of completed questions to set as the width of the progress bar
        const completionPercentage = Math.round((completedQuestionCount / totalQuestionCount) * 100);

        // update the values of both items with the completedQuestionCount
        progressBarNode.setAttribute('aria-valuenow', completedQuestionCount);
        progressBarNode.style.width = `${completionPercentage}%`;
        progressBarLabel.textContent = completionPercentage;
    }

    static updateProgressBarTotalValue(progressBarContainerNode, totalQuestionCount) {
        // using a reference to the progress bar node, update the max value
        const progressBarNode = progressBarContainerNode.querySelector('.progress-bar');
        progressBarNode.setAttribute('aria-valuemax', totalQuestionCount);
    }

    static getProgressBarStatus() {
        // get a reference to the question inputs from the branching form node
        const branchingFormNode = document.forms[0];
        const questionInputs = Array.from(branchingFormNode.querySelectorAll('.form-group:not(.sub-question):not(.injected-form-group)'));
        let completedQuestionCount = 0;
        // loop through each of the question nodes,check if the question has a value that has changed from the initial val
        questionInputs.forEach(question => {
            // TODO: Get progress bar working with injected form questions
            if (!question.parentElement.classList.contains('injected-form-section')) {
                if (question.classList.contains('select-multiple-input')) {
                    // check if the select multiple input has any checked values, if it does increment the completed question count
                    const checkedInputs = question.querySelectorAll('input[type="checkbox"]:checked');
                    if (checkedInputs.length > 0) {
                        completedQuestionCount++;
                        question.querySelector('.progress-badge').className = 'progress-badge complete';
                    } else {
                        question.querySelector('.progress-badge').className = 'progress-badge incomplete';
                    }
                } else {
                    // using the current value and the initial value, check if either are not an empty string and then
                    // increment the number of completed questions
                    let userAnswer = question.getAttribute('data-user-answer');

                    let currentValue = (question.children.length > 1)
                        ? question.children[1].value
                        : question.children[0].value;
                    if (currentValue !== '' || userAnswer !== '') {
                        completedQuestionCount++;
                        question.querySelector('.progress-badge').className = 'progress-badge complete';
                    } else {
                        question.querySelector('.progress-badge').className = 'progress-badge incomplete';
                    }
                }
            }
        });

        // return an object containing the completed question counts and the question inputs
        return {
            completedQuestionCount: completedQuestionCount,
            questionInputs: questionInputs
        };
    }

    static updateSubmitForReviewButton(completedQuestionCount, questionInputList, submitBtnId) {
        const submitButton = document.getElementById(submitBtnId);
        if (submitButton) {
            if (completedQuestionCount >= questionInputList.length) {
                submitButton.disabled = false;
                submitButton.classList.add('main');
            } else {
                submitButton.className = 'button action active';
            }
        }
    }

    static createOtherOptionTextBox(questionIdentifier, optionNode = null, outputString = false, optionId = null, userAnswer = '') {
        // using the option id we can override the value of the other option to what is inside the text box. Using the
        // parent question id we can add or remove the text box to write in the other option
        const optionIdentifier = (optionId) ? optionId : optionNode.id;
        const textBoxHTMLString = `<div class="form-group" id="${optionIdentifier}-container">
                                        <input type="text" name="${optionIdentifier}" id="${optionIdentifier}"
                                            class="other-value-text-input sub-question"
                                            value="${(userAnswer)}"
                                            data-option-id="${optionIdentifier}"  
                                            data-text-box-parent-question="${questionIdentifier}" 
                                            onchange="BranchingFormsApp.handleOtherOptionTextBoxChangeEvent(event)">
                                   </div>`;

        if (outputString) {
            return textBoxHTMLString;
        }

        // after creating the formatted string, convert it to an html node and then insert it inside the parent question container
        // but after the select/ choice element
        const textBoxNode = navigationApp.convertStringToHTML(textBoxHTMLString);

        // check to make sure this specific textBoxNode does not already exist, if it does exit early
        if (!document.getElementById(textBoxNode.id)) {
            const optionContainer = optionNode.parentNode.parentNode;
            optionContainer.insertBefore(textBoxNode, optionNode.parentNode.nextSibling);

            // scroll the textbox into view by setting the scroll view to the scroll height of our container (bottom)
            optionContainer.scrollTop = optionContainer.scrollHeight;
        }

    }

    static handleRemoveOtherOptionTextBox(parentQuestionIdentifier) {
        // remove any text box that exist under this question
        const activeTextBox = document.querySelector(`[data-text-box-parent-question="${parentQuestionIdentifier}"]`);
        if (activeTextBox) {
            activeTextBox.parentElement.remove();
        }
    }

    static handleOtherOptionTextBoxChangeEvent(changeEvent) {
        // get the question identifier from the data-parent-question attribute and set the value to whatever is in the textbox
        const parentOptionIdentifier = changeEvent.currentTarget.getAttribute('data-option-id');
        document.getElementById(parentOptionIdentifier).value = changeEvent.currentTarget.value;
    }

    static handleOptionClickEvent(mouseEvent) {
        // first check if there are any sub questions
        let subQuestionList = mouseEvent.currentTarget.parentNode.querySelectorAll('.sub-question');

        // if we cannot find any sub questions in the select container, look for sub questions outside of the div by using the reference id
        if (subQuestionList.length === 0) {
            const optionIdentifier = mouseEvent.currentTarget.id;
            subQuestionList = document.querySelectorAll(`[data-parent-option="${optionIdentifier}"]`);
        }
        // if we still cannot find any sub questions, check to see if the question that was updated was a single select
        // if it was, search by using the selected option
        if (subQuestionList.length === 0 && mouseEvent.currentTarget.nodeName === 'SELECT') {
            const selectedOption = mouseEvent.currentTarget.options[mouseEvent.currentTarget.selectedIndex];
            subQuestionList = document.querySelectorAll(`[data-parent-option="${selectedOption.id}"]`);
        }

        // now if we found any sub questions show them or hide them based on the clicked value of the option
        if (mouseEvent.currentTarget.nodeName !== 'SELECT') {
            // if the option was checked then show the sub question, otherwise hide them
            if (mouseEvent.currentTarget.checked) {
                BranchingFormsApp.updateSubQuestionInputs(subQuestionList, false);
            } else {
                BranchingFormsApp.updateSubQuestionInputs(subQuestionList, true);
            }
        } else {
            // if we are dealing with single select questions, we need to show all the corresponding question for
            // this selected input, and hide any potential options for the not selected input
            BranchingFormsApp.updateSubQuestionInputs(subQuestionList, false);

            // get all of the options from this input
            const optionNodeList = Array.from(mouseEvent.currentTarget.options);
            const selectedOption = optionNodeList[mouseEvent.currentTarget.selectedIndex];
            optionNodeList.forEach(option => {
                if (option !== selectedOption) {
                    const subQuestionForOptionList = document.querySelectorAll(`[data-parent-option="${option.id}"]`);
                    BranchingFormsApp.updateSubQuestionInputs(subQuestionForOptionList, true);
                }
            });
        }
    }

    static updateSubQuestionInputs(subQuestionList, isHidden = true) {
        subQuestionList.forEach(subQuestion => {
            const formInput = subQuestion.querySelector('select, input');
            if (isHidden) {
                // hide the sub question
                subQuestion.classList.add('hidden');
                if (formInput) {
                    formInput.disabled = true;
                }
            } else {
                // show the sub question container and enable the select inputs
                subQuestion.classList.remove('hidden');
                const formInput = subQuestion.querySelector('select, input');
                if (formInput) {
                    formInput.disabled = false;
                }
            }
        });
    }

    // TODO: write function to load the current users answer in the other option inside a text box that specifies other
    static handleOptionChangeEvent(changeEvent) {
        // when an option is selected check the data mapping of the new option and then see if we need to handle any changes
        // like creating a new text box when other is selected
        const selectNodeId = changeEvent.currentTarget.id;
        let selectedOption = (changeEvent.currentTarget.options)
            ? changeEvent.currentTarget.options[changeEvent.currentTarget.selectedIndex]
            : changeEvent.currentTarget;
        const optionMapping = selectedOption.getAttribute('data-option-mapping');

        // check if the option
        if (optionMapping === "other<free_text>") {
            // create the other option text box and set on the change event to set the value attribute of the parent
            // select element
            if (selectedOption.type !== "checkbox" || selectedOption.checked) {
                BranchingFormsApp.createOtherOptionTextBox(selectNodeId, selectedOption);
            } else if (!selectedOption.checked && selectedOption.type === "checkbox") {
                BranchingFormsApp.handleRemoveOtherOptionTextBox(selectNodeId);
            }
        } else {
            BranchingFormsApp.handleRemoveOtherOptionTextBox(selectNodeId);
        }

        // now that we have dealt with the option mapping, check if the selected option has any sub-questions
        // by checking for any questions with a matching data-parent-option attribute with the selected options id
        const subQuestions = Array.from(document.querySelectorAll(`[data-parent-question="${selectNodeId}"]`));
        subQuestions.forEach(subQuest => {
            // check if the date-parent-option is the same as the selected and then show or hide the element with the hidden class
            const parentOptionIdentifier = subQuest.getAttribute('data-parent-option');
            subQuest.className = (parentOptionIdentifier === selectedOption.id)
                ? 'form-group sub-question'
                : 'form-group hidden sub-question';
        });
    }

    static handleSectionNavClick(clickEvent) {
        // first get a reference to the parentNode to get the corresponding section id
        const sectionIdentifier = clickEvent.currentTarget.getAttribute('data-section-id');
        const navContainerNode = clickEvent.currentTarget.parentNode.parentNode;

        // now hide all of the sections and remove the hidden class for the corresponding section
        const sections = Array.from(document.querySelectorAll('.user-profile-section'));
        sections.forEach(section => section.className = "user-profile-section hidden");
        document.getElementById(sectionIdentifier).classList.remove('hidden');
        BranchingFormsApp.updateSectionNav(navContainerNode);
    }

    static updateSectionNav(containerNavNode) {
        const circleNavNode = containerNavNode.querySelector('.circle');

        // after showing the section make sure the clicked circle is active and the others are not
        const userProfileNavCircles = Array.from(document.querySelectorAll('.user-profile-section-nav-item .circle'));
        userProfileNavCircles.forEach(circle => {
            circle.className = "circle";
            if (circle.parentNode.parentNode.classList.contains('active')) {
                circle.parentNode.parentNode.classList.remove('active');
            }
        });
        circleNavNode.classList.add('active');
        containerNavNode.classList.add('active');
    }

    static handleNextSectionClick(clickEvent) {
        // first get a reference to the current section and the total number of sections
        const currentSection = document.querySelector('.user-profile-section:not(.hidden)');
        const allFormSections = Array.from(document.querySelectorAll('.user-profile-section'));

        // see how many sections this current button will go back or forth through to display
        const formSectionValueChange = Number.parseInt(clickEvent.currentTarget.getAttribute('data-section-change'));

        // get the list index of the currentSection
        const currentSectionIndex = allFormSections.findIndex((node) => node.id === currentSection.id);

        // if the current section is not the last section, set the current section to hidden display the next section
        const newSectionIndex = currentSectionIndex + formSectionValueChange;

        if ((newSectionIndex < allFormSections.length && Math.sign(formSectionValueChange) === 1) || (newSectionIndex >= 0 && Math.sign(formSectionValueChange) === -1)) {
            currentSection.classList.add('hidden');
            const displayedSection = allFormSections[newSectionIndex];
            displayedSection.classList.remove('hidden');

            // update the nav nodes after the next or back buttons were clicked by getting a reference to the circle div
            // and the li node that contains the nav
            const containerNavNode = document.querySelector(`li.user-profile-section-nav-item[data-section-id="${displayedSection.id}"]`);
            BranchingFormsApp.updateSectionNav(containerNavNode);
        }

        // now update the next and previous section buttons to be enabled or disabled and show the proper main class
        // using ternary conditional statements we can set all of the properties needed for next and back buttons
        const backButton = document.getElementById(BranchingFormsApp.backButtonIdentifier);
        const nextButton = document.getElementById(BranchingFormsApp.nextButtonIdentifier);
        if (nextButton && backButton) {
            nextButton.disabled = (newSectionIndex >= allFormSections.length - 1);
            nextButton.className = (newSectionIndex >= allFormSections.length - 1) ? 'button action active' : 'button action active main';
            backButton.disabled = (newSectionIndex <= 0);
            backButton.className = (newSectionIndex <= 0) ? 'button action active' : 'button action active main';
        } else {
            console.warn('We could not find the next and back button at this time');
        }
    }

    static dispatchFakeEvent(eventType = 'change', htmlNode) {
        // create and fire a fake html event, this can be used to trigger form events like to display different sub questions
        // that should be active based on the users answer
        const fakeEvent = new Event(eventType);
        // create a new event that does not bubble up through the dom and is cancelable by parent nodes
        fakeEvent.initEvent(eventType, false, true);
        htmlNode.dispatchEvent(fakeEvent);
    }

    // TODO: create static function to scan the DOM and display any hidden sub questions that should be active
    static displayActiveSubQuestions() {
        // first using the different names of inputs, scan each element and check if the corresponding option is selected
        // and if it is remove the hidden class from the sub question. This function should only be used after using
        // the requestBranchingPathForms method
        const onChangeElements = Array.from(document.querySelectorAll('.select-single-input, .select-multiple-option'));
        // onChangeElements.forEach(element => {
        //     if (element.onchange) {
        //         // BranchingFormsApp.dispatchFakeEvent('change', element);
        //     }
        // });
    }

    static handleSubmitUserProfileForm(clickEvent) {
        // Stop the form from using the default submit event
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        let formNodeIdentifier = clickEvent.currentTarget.getAttribute('data-form-node');

        // let userIdentifier = clickEvent.currentTarget.getAttribute('data-user-id');

        // create a form data object from the entire form node, this will cover all input nodes with name attributes
        const userProfileFormNode = document.getElementById(formNodeIdentifier);
        const redirectURL = userProfileFormNode.getAttribute('data-redirect-url');
        const submitURL = userProfileFormNode.getAttribute('data-submit-url');

        // disable any dynamic form data elements before submitting the form, we will re-enable these items after the
        // form is submitted
        const customOptionElements = Array.from(document.querySelectorAll('[data-option-id]'));
        customOptionElements.forEach(opt => opt.disabled = true);
        let userProfileFormData = new FormData(userProfileFormNode);

        // TODO: remove code once we confirm if text area's are added to form data objects by default
        // append on the remaining form items for any nodes like text area that are not captured earlier (only use
        // text area's with the name attribute set)
        // const textAreaInputs = Array.from(document.querySelectorAll('textarea[name]:not([name=""])'));
        // const invalidTextAreaValues = [null, "", "<empty string>", "null"];
        // textAreaInputs.forEach(textArea => {
        //     // we need to set the value to an empty string when a textarea shows up as null (string)
        //     const trimmedTextAreaValue = textArea.value.trim();
        //     if (invalidTextAreaValues.indexOf(trimmedTextAreaValue) === -1) {
        //         // userProfileFormData.append(textArea.getAttribute('name'), trimmedTextAreaValue);
        //     }
        // });
        // Check the data attributes of the button to see if there are any extra headers applicable for the submit request
        const extraHeaders = {};
        if (clickEvent.currentTarget.getAttribute('data-submit-for-review') === "true") {
            extraHeaders['X-SUBMIT-RESEARCHER-FOR-REVIEW'] = true;
        }

        // send the request to submit the form
        // check if the form elements are saving correctly to the form data
        sendFetchRequest({
            url: submitURL,
            method: 'POST',
            data: userProfileFormData,
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
                'Accept': 'application/json',
                ...extraHeaders
            },
            callback: (response) => {
                // if there is a response.error and response.form_errors, show those items in form
                const { error, form_errors: formErrors } = response;
                if (error && formErrors) {
                    // first find all of the form-group-errors containers and wipe them out
                    Array.from(document.querySelectorAll('.form-group-errors')).forEach(errorGroup => errorGroup.textContent = '');

                    // Find the corresponding input, then build a string with all of the form errors and
                    // place them into the form-group-errors container
                    for (const key in formErrors) {
                        const formGroupWithErrors = document.getElementById(`id_${key}`);
                        let formErrorString = '';
                        formErrors[key].forEach((inputError) => formErrorString += `<li>${inputError}</li>`);
                        formGroupWithErrors.parentElement.querySelector('.form-group-errors').innerHTML = formErrorString;
                    }
                } else {
                    // re-enable any disabled form elements after a successful submission
                    customOptionElements.forEach(opt => opt.disabled = false);

                    // send the user profile page to view their submission
                    location.href = redirectURL;
                }
            },
            onFail: (error) => {
                console.error("There was an error retrieving the User Profile Questions", error);
            }
        });
    }

    static createSpinnerHTMLString(loadingText = 'Loading...') {
        return `<div class="loader-container"><div class="loader"></div><p class="loader-text">${loadingText}</p></div>`;
    }

    static createProgressBadge(isComplete) {
        return navigationApp.convertStringToHTML(
            `<div class="progress-badge ${(isComplete) ? 'complete' : 'incomplete'}"></div>`
        );
    }
}