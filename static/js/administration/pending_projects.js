const pendingProjectsApp = {
    pendingProjectsData: null,
    keyedPendingProjects: null,
    init: () => {
        pendingProjectsApp.requestPendingProjectsData().catch(error => console.error(error));
    },
    // methods to modify the pending projects datatables
    savePendingProjectsData: async function () {
        pendingProjectsApp.keyedPendingProjects = await adminApp.convertToKeyedObjectDict(pendingProjectsApp.pendingProjectsData);
    },
    requestPendingProjectsData: async function () {
        await sendFetchRequest({
            url: `/admin/pending_projects_data/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({ admin, pending_projects: pendingProjects }) => {
                // using the user profile response data, we can save and convert the information into a keyed object
                // and then we can render the datatable for each user using this information and reload each user quickly
                // using the keyed dictionary
                pendingProjectsApp.pendingProjectsData = pendingProjects;
                pendingProjectsApp.savePendingProjectsData().then(pendingProjectsApp.renderPendingProjectsDataTable).then(
                    ({
                         htmlString,
                         nodeIdentifier,
                         tableIdentifier
                     }) => adminApp.renderDataTable(htmlString, nodeIdentifier, tableIdentifier)
                );
            },
            onFail: (error) => {
                console.error("There was an error retrieving the Pending Research Projects.", error);
            }
        });
    },
    renderPendingProjectsDataTable: async function () {
        // Create the Table header as a JS interpolated string
        const pendingProjectsTableHeaders = adminApp.createTableRowFromArray([
            'Project ID',
            'Project Title',
            'Creator',
            'Location',
            'Last Updated',
            'Action',
        ], 'th', 'tr', 'theme-color');
        let pendingProjectsTableHTML = `<table id="pending-projects-table" class="row-border"><thead>${pendingProjectsTableHeaders}</thead><tbody>`;
        pendingProjectsApp.pendingProjectsData.forEach(({ id, creator, title, icu_location, updated_at }) => {
            // loop over each user in the request and set their info in each table row
            const researchProjectRowData = adminApp.createTableRowFromArray([
                id,
                title,
                creator,
                icu_location,
                updated_at,
                `<div class="button-container">
                    <a href="/app/research_project/${id}/">
                        <button type="button" name="view-research-project-action" data-project-id="${id}">
                            View Project
                        </button>
                    </a>
                    <!-- TODO: Show a toast notification on success -->
                    <a href="/admin/approve_pending_project/${id}/" onclick="adminApp.showToastResponse(event, pendingProjectsApp.renderPendingProjectsDataTable)">
                        <button type="button" name="edit-research-project-action" data-project-id="${id}">
                            Approve
                        </button>
                    </a>
                </div>`
            ]);
            pendingProjectsTableHTML += researchProjectRowData;
        });
        return {
            htmlString: pendingProjectsTableHTML + '</tbody></table>',
            nodeIdentifier: 'pending-projects-data-table',
            tableIdentifier: 'pending-projects-table'
        };
    },
}

document.addEventListener('DOMContentLoaded', pendingProjectsApp.init.bind(pendingProjectsApp));
