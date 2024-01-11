const membersPermissionsApp = {
    init: function () {
        this.populateTeamMembersTable();

        const saveMembersPermissionsBtn = document.getElementById('save-members-permissions-btn');

        if (saveMembersPermissionsBtn) {
            saveMembersPermissionsBtn.addEventListener('click', this.saveMembersPermissions);
        }

        const removeTeamMemberButtonList = Array.from(document.getElementsByName('remove-user-from-project-btn'));
        const deleteTeamMemberButtonList = Array.from(document.getElementsByName('delete-user-from-project-btn'));

        removeTeamMemberButtonList.forEach(deleteButton => {
            deleteButton.addEventListener('click', this.removeResearchTeamMember);
        });

        deleteTeamMemberButtonList.forEach(deleteButton => {
            deleteButton.addEventListener('click', this.deleteResearchTeamMember);
        });
    },
    saveMembersPermissions: () => {
        const permissions_dict = membersPermissionsApp.serializeMembersPermissions();

        sendFetchRequest({
            url: `/app/research_project/${globalValues.projectIdentifier}/save_permissions/`,
            method: 'POST',
            data: JSON.stringify(permissions_dict),
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({success: successMessage, error: errorMessage}) => {
                if (errorMessage) {
                    toastApp.createNotification('error', 'Failed to save permissions', errorMessage);
                    return;
                }
                successMessage = `${successMessage}. Refreshing the page now.`;
                toastApp.createNotification('success', 'User permissions', successMessage, () => location.reload());
            },
            onFail: ({error}) => {
                toastApp.createNotification('error', 'Failed to save permissions', error);
            }
        });
    },
    removeResearchTeamMember: (clickEvt) => {
        const userIdentifier = clickEvt.currentTarget.getAttribute('data-user-id');

        sendFetchRequest({
            url: `/app/research_project/${globalValues.projectIdentifier}/remove_team_member/${userIdentifier}/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({success: successMessage, error: errorMessage}) => {
                if (errorMessage) {
                    toastApp.createNotification('error', 'Failed to remove team member', errorMessage);
                } else {
                    toastApp.createNotification(
                        'success', 'Removed team member', successMessage, () => location.reload()
                    );
                }
            },
            onFail: ({error}) => {
                toastApp.createNotification('error', 'Failed to remove team member', error);
            }
        });
    },
    deleteResearchTeamMember: (clickEvt) => {
        const userIdentifier = clickEvt.currentTarget.getAttribute('data-user-id');

        sendFetchRequest({
            url: `/app/research_project/${globalValues.projectIdentifier}/delete_team_member/${userIdentifier}/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({success: successMessage, error: errorMessage}) => {
                if (errorMessage) {
                    toastApp.createNotification('error', 'Failed to delete team member', errorMessage);
                } else {
                    toastApp.createNotification(
                        'success', 'Deleted team member. ', successMessage, () => location.reload()
                    );
                }
            },
            onFail: ({error}) => {
                toastApp.createNotification('error', 'Failed to delete team member', error);
            }
        });
    },
    populateTeamMembersTable: () => {
        new DataTable(document.getElementById('members-permissions-table'), {
            lengthMenu: [[20, -1], [20, 'All']],
            searching: false,
            bInfo: false
        });
    },
    serializeMembersPermissions: () => {
        const members = document.querySelectorAll('#members-permissions-table .member-row');
        const permissions_dict = {permissions: []};

        members.forEach(member => {
            const isAnonymous = member.getAttribute('data-is-anonymous') === 'True';
            if (isAnonymous) {
                return;
            }

            const userId = member.getAttribute('data-user-id');
            const isLeadResearcher = document.getElementById(`is-lead-researcher-${userId}`).checked;
            const isActive = document.getElementById(`is-active-${userId}`).checked;

            permissions_dict.permissions.push({
                user_id: userId, is_lead_researcher: isLeadResearcher, is_active: isActive
            });
        });
        return permissions_dict;
    }
};

document.addEventListener('DOMContentLoaded', membersPermissionsApp.init.bind(membersPermissionsApp));
