const userManagementApp = {
    systemUserProfileData: null,
    keyedSystemUserProfileData: null,
    init: () => {
        userManagementApp.requestSystemUserProfileData().catch(error => console.error(error));
    },
    requestSystemUserProfileData: async function () {
        sendFetchRequest({
            url: `/admin/user_profile_data/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({ users, admin }) => {
                // using the user profile response data, we can save and convert the information into a keyed object
                // and then we can render the datatable for each user using this information and reload each user quickly
                // using the keyed dictionary
                userManagementApp.systemUserProfileData = users;
                userManagementApp.saveSystemUserProfileData().then(userManagementApp.renderSystemUserProfileDataTable).then(
                    ({
                         htmlString,
                         nodeIdentifier,
                         tableIdentifier
                     }) => adminApp.renderDataTable(htmlString, nodeIdentifier, tableIdentifier)
                );
            },
            onFail: (error) => {
                console.error("There was an error retrieving the User Profile Form Questions & Sections.", error);
            }
        });
    },
    saveSystemUserProfileData: async function () {
        userManagementApp.keyedSystemUserProfileData = await adminApp.convertToKeyedObjectDict(userManagementApp.systemUserProfileData);
    },
    renderSystemUserProfileDataTable: async function () {
        // Create the Table header as a JS string
        const userTableHeaders = adminApp.createTableRowFromArray([
            'Name',
            'Username',
            'Role',
            'Active',
            'Email',
            'Projects Lead',
            'Projects Participant',
            'Action',
        ], 'th', 'tr', 'theme-color');
        let systemUserProfileTableHTML = `<table id="system-user-profile-table" class="row-border"><thead>${userTableHeaders}</thead><tbody>`;

        userManagementApp.systemUserProfileData.forEach(({ user, username, role, email, id, first_name, last_name, is_active, projects_lead, projects_participating }) => {
            // loop over each user in the request and set their info in each table row
            const userRoleInput = `
                <select id="user_role" data-user-id=${user} onchange="userManagementApp.changeUserRole(event)">
                    <option value="PATIENT" ${(role.toUpperCase() === "PATIENT") ? 'selected' : ''}>Patient Partner</option>
                    <option value="FAMILY_OF_PATIENT" ${(role.toUpperCase() === "FAMILY_OF_PATIENT") ? 'selected' : ''}>Family of Patient</option>
                    <option value="CARETAKER" ${(role.toUpperCase() === "CARETAKER") ? 'selected' : ''}>Caretaker of Patient</option>
                    <option value="RESEARCHER" ${(role.toUpperCase() === "RESEARCHER") ? 'selected' : ''}>Researcher</option>
                    <option value="PASSIVE" ${(role.toUpperCase() === "PASSIVE") ? 'selected' : ''}>Passive</option>
                </select>
            `
            const userRowData = adminApp.createTableRowFromArray([
                `${first_name} ${last_name}`,
                username,
                userRoleInput,
                String(is_active).toUpperCase(),
                email,
                projects_lead,
                projects_participating,
                `<div class="button-container align-centre-column">
                    <a href="/app/profile/${id}/">
                        <button type="button" name="view-user-action" data-user-id="${user}">View Profile</button>
                    </a>
                    <button type="button" name="change-user-password-action" data-user-id="${user}" onclick="userManagementApp.changeUserPassword(event)">
                        Reset Password
                    </button>
                    ${(!is_active) ? `<a href="#"><button type="button" name="activate-user-action">Activate</button></a>` : ''}
                </div>`
            ]);
            systemUserProfileTableHTML += userRowData;
        });
        return {
            htmlString: systemUserProfileTableHTML + '</tbody></table>',
            nodeIdentifier: 'system-user-profile-data-table',
            tableIdentifier: 'system-user-profile-table'
        };
    },
    changeUserPassword: (clickEvent) => {
        // change the password for the specified user by first getting the user id and then making the request
        const requestedUserIdentifier = clickEvent.currentTarget.getAttribute('data-user-id')
        sendFetchRequest({
            url: `/admin/change_password/`,
            method: 'POST',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            data: JSON.stringify({
                'user_id': requestedUserIdentifier
            }),
            callback: ({success: successMessage, new_password: newPassword}) => {
                alert(`New Password: ${newPassword}`)
            },
            onFail: (error) => {
                console.error("There was an error changing the password for the selected user", error);
            }
        });
    },
    changeUserRole: (changeEvent) => {
        // change the password for the specified user by first getting the user id and then making the request
        const requestedUserIdentifier = changeEvent.currentTarget.getAttribute('data-user-id')

        const userRoleFormData = new FormData()
        userRoleFormData.append('user_role', changeEvent.currentTarget.value)
        userRoleFormData.append('user_id', requestedUserIdentifier)

        sendFetchRequest({
            url: `/admin/change_user_role/`,
            method: 'POST',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            data: userRoleFormData,
            callback: ({success: successMessage}) => {
                toastApp.createNotification('success', 'Updated User Role', successMessage)
            },
            onFail: (error) => {
                console.error("There was an error changing the password for the selected user", error);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', userManagementApp.init.bind(userManagementApp));
