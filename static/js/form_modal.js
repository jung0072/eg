const formModalApp = {
    redirectUrlTime: 3000,
    init: () => {
        const formSubmitButtonList = Array.from(document.getElementsByName('submit-form-modal-button'));
        formSubmitButtonList.forEach(submitBtn => {
            submitBtn.addEventListener('click', formModalApp.submitFormModal);
        });
    },
    submitFormModal: (clickEvt) => {
        clickEvt.preventDefault();
        clickEvt.stopPropagation();

        // first get the form from the clicked button, it is 3 parents up
        const formNode = clickEvt.currentTarget.parentElement.parentElement.parentElement;

        // now build the form data from the formNode inputs and submit the post request
        const formData = new FormData(formNode);
        const formName = formNode.getAttribute('data-form-name');
        sendFetchRequest({
            url: formNode.action,
            method: 'POST',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            data: formData,
            callback: ({ success: successMessage, error: errorMessage, redirect_link: redirectLink }) => {
                if (errorMessage) {
                    // build the error message from the different values in the errors dict
                    if (typeof errorMessage === "object") {
                        let messageToUser = '';
                        for (const key in errorMessage) {
                            messageToUser += `Error at ${key} - ${errorMessage[key]['message']}\n`;
                        }
                        toastApp.createNotification('error', `Failed to ${formName}`, messageToUser);
                    } else {
                        toastApp.createNotification('error', `Failed to ${formName}`, errorMessage);
                    }

                } else {
                    toastApp.createNotification(
                        'success', `${formName}`, successMessage, () => modalApp.closeAllModals()
                    );
                    // redirect the user to the new page after 3 seconds
                    if (redirectLink) {
                        setTimeout(() => location.href = redirectLink, formModalApp.redirectUrlTime);
                    }
                }
            },
            onFail: ({ error }) => {
                toastApp.createNotification('error', `Failed to ${formName}`, error);
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', formModalApp.init.bind(formModalApp));