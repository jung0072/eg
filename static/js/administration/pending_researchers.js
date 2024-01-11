const pendingResearchersApp = {
    pendingResearchersData: null,
    keyedPendingResearchers: null,
    init: () => {
        pendingResearchersApp.requestPendingResearchersData().catch(error => console.error(error));
    },
    // methods to modify the pending researchers data tables
    savePendingResearchersData: async function () {
        pendingResearchersApp.keyedPendingResearchers = await adminApp.convertToKeyedObjectDict(
            pendingResearchersApp.pendingResearchersData
        );
    },
    requestPendingResearchersData: async function () {
        await sendFetchRequest({
            url: `/admin/pending_researchers_data/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({admin, pending_researchers: pendingResearchers}) => {
                // using the user profile response data, we can save and convert the information into a keyed object
                // and then we can render the datatable for each user using this information and reload each user quickly
                // using the keyed dictionary
                pendingResearchersApp.pendingResearchersData = pendingResearchers;
                pendingResearchersApp.savePendingResearchersData().then(pendingResearchersApp.renderPendingResearchersDataTable).then(
                    ({
                         htmlString,
                         nodeIdentifier,
                         tableIdentifier
                     }) => adminApp.renderDataTable(htmlString, nodeIdentifier, tableIdentifier)
                );
            },
            onFail: (error) => {
                console.error("There was an error retrieving the Pending Researchers.", error);
            }
        });
    },
    renderPendingResearchersDataTable: async function () {
        // Create the Table header as a JS interpolated string
        const pendingResearchersTableHeaders = adminApp.createTableRowFromArray([
            'User ID',
            'Name',
            'Submission Date',
            'Clinical Area',
            'Action',
        ], 'th', 'tr', 'theme-color');
        let pendingResearchersTableHTML = `<table id="pending-researchers-table" class="row-border"><thead>${pendingResearchersTableHeaders}</thead><tbody>`;
        pendingResearchersApp.pendingResearchersData.forEach(({
             id,
             user: userID,
             first_name,
             last_name,
             clinical_area,
             researcher_form_review_date
         }) => {
            // loop over each user in the request and set their info in each table row
            const researchInterestRowData = adminApp.createTableRowFromArray([
                userID,
                `${first_name} ${last_name}`,
                new Date(researcher_form_review_date).toLocaleDateString(),
                clinical_area,
                `<div class="button-container">
                    <a href="/app/profile/${userID}/">
                        <button type="button" name="view-research-interests-action" data-researcher-id="${userID}">
                            View Profile
                        </button>
                    </a>
                    <!-- TODO: Show a popup about the current researcher before approving -->
                    <a href="/admin/approve_pending_researcher/${userID}/" onclick="adminApp.showToastResponse(event, pendingResearchersApp.renderPendingResearchersDataTable)">
                        <button type="button" name="edit-research-interests-action" data-researcher-id="${userID}">
                            Approve
                        </button>
                    </a>
                </div>`
            ]);
            pendingResearchersTableHTML += researchInterestRowData;
        });
        return {
            htmlString: pendingResearchersTableHTML + '</tbody></table>',
            nodeIdentifier: 'pending-researchers-data-table',
            tableIdentifier: 'pending-researchers-table'
        };
    },
}

document.addEventListener('DOMContentLoaded', pendingResearchersApp.init.bind(pendingResearchersApp));
