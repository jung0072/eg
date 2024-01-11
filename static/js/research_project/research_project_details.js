const researchProjectDetailsApp = {
    init: function () {
        // set the event listener on the request to join project button if it exists
        const requestToJoinButton = document.getElementById('request-to-join-project-button');
        if (requestToJoinButton) {
            requestToJoinButton.addEventListener('click', this.requestToJoinResearchProject);
        }

        // set the event listener on the activate team member button if it exists
        const activateTeamMemberButtonList = Array.from(document.getElementsByName('activate-team-member-button'));
        activateTeamMemberButtonList.forEach(deleteButton => {
            deleteButton.addEventListener('click', this.activateResearchTeamMember);
        });

        // set the event listener on the accept project invite button if it exists
        const acceptProjectInviteButton = document.getElementById('accept-project-invitation-button');
        if (acceptProjectInviteButton) {
            acceptProjectInviteButton.addEventListener('click', this.acceptProjectInvitation);
        }
    },
    requestToJoinResearchProject: (clickEvt) => {
        const projectIdentifier = clickEvt.currentTarget.getAttribute('data-project-id');
        sendFetchRequest({
            url: `/app/research_project/request_to_join/${projectIdentifier}/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({ success: successMessage, error: errorMessage }) => {
                if (errorMessage) {
                    toastApp.createNotification('error', 'Failed to join project', errorMessage);
                } else {
                    toastApp.createNotification('success', 'Joined Project', successMessage);
                }
            },
            onFail: ({ error }) => {
                toastApp.createNotification('error', 'Failed to join project', error);
            }
        });
    },
    activateResearchTeamMember: (clickEvt) => {
        const projectIdentifier = clickEvt.currentTarget.getAttribute('data-project-id');
        const userIdentifier = clickEvt.currentTarget.getAttribute('data-user-id');
        sendFetchRequest({
            url: `/app/research_project/${projectIdentifier}/activate_user/${userIdentifier}/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({ success: successMessage, error: errorMessage }) => {
                if (errorMessage) {
                    toastApp.createNotification('error', 'Failed to activate team member', errorMessage);
                } else {
                    toastApp.createNotification(
                        'success', 'Activated team member', successMessage, () => location.reload()
                    );
                }
            },
            onFail: ({ error }) => {
                toastApp.createNotification('error', 'Failed to activate team member', error);
            }
        });
    },
    acceptProjectInvitation: (clickEvt) => {
        const projectIdentifier = clickEvt.currentTarget.getAttribute('data-project-id');
        sendFetchRequest({
            url: `/app/research_project/join/${projectIdentifier}/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({ success: successMessage, error: errorMessage }) => {
                if (errorMessage) {
                    toastApp.createNotification('error', 'Failed to accept project invitation', errorMessage);
                } else {
                    toastApp.createNotification(
                        'success', 'Accepted Project Invitation', successMessage, () => location.reload()
                    );
                }
            },
            onFail: ({ error }) => {
                toastApp.createNotification('error', 'Failed to activate team member', error);
            }
        });
    }
};

// Set the values for the form node id and the form navigation node id's to the branching forms app before running

document.addEventListener('DOMContentLoaded', researchProjectDetailsApp.init.bind(researchProjectDetailsApp));
