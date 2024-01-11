const projectManagementApp = {
    researchProjectsData: null,
    keyedResearchProjects: null,
    init: () => {
        projectManagementApp.requestResearchProjectsData().catch(error => console.error(error));
    },
    // methods to modify the active projects datatables
    saveResearchProjectsData: async function () {
        projectManagementApp.keyedResearchProjects = await adminApp.convertToKeyedObjectDict(projectManagementApp.researchProjectsData);
    },
    requestResearchProjectsData: async function () {
        await sendFetchRequest({
            url: `/admin/research_projects_data/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({ admin, research_projects: researchProjects }) => {
                // using the user profile response data, we can save and convert the information into a keyed object
                // and then we can render the datatable for each user using this information and reload each user quickly
                // using the keyed dictionary
                projectManagementApp.researchProjectsData = researchProjects;
                projectManagementApp.saveResearchProjectsData().then(projectManagementApp.renderResearchProjectsDataTable).then(
                    ({
                         htmlString,
                         nodeIdentifier,
                         tableIdentifier
                     }) => adminApp.renderDataTable(htmlString, nodeIdentifier, tableIdentifier)
                );
            },
            onFail: (error) => {
                console.error("There was an error retrieving the Research Projects.", error);
            }
        });
    },
    renderResearchProjectsDataTable: async function () {
        // Create the Table header as a JS interpolated string
        const researchProjectsTableHeaders = adminApp.createTableRowFromArray([
            'Project ID',
            'Project Title',
            'Creator',
            'Location',
            'Last Updated',
            'Action',
        ], 'th', 'tr', 'theme-color');
        let researchProjectsTableHTML = `<table id="research-projects-table" class="row-border"><thead>${researchProjectsTableHeaders}</thead><tbody>`;
        projectManagementApp.researchProjectsData.forEach(({ id, creator, title, icu_location, updated_at }) => {
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
                    <a href="/admin/delete_research_project/${id}/" onclick="adminApp.showToastResponse(event, projectManagementApp.requestResearchProjectsData)">
                        <button type="button" name="edit-research-project-action" data-project-id="${id}">
                            Delete
                        </button>
                    </a>
                </div>`
            ]);
            researchProjectsTableHTML += researchProjectRowData;
        });
        return {
            htmlString: researchProjectsTableHTML + '</tbody></table>',
            nodeIdentifier: 'research-projects-data-table',
            tableIdentifier: 'research-projects-table'
        };
    },
}

document.addEventListener('DOMContentLoaded', projectManagementApp.init.bind(projectManagementApp));
