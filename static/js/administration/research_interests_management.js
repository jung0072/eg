const researchInterestsManagementApp = {
    researchInterestsData: null,
    keyedResearchInterests: null,
    init: () => {
        researchInterestsManagementApp.requestResearchInterestsData().catch(error => console.error(error));
    },
    saveResearchInterestsData: async function () {
        researchInterestsManagementApp.keyedResearchInterests = await adminApp.convertToKeyedObjectDict(
            researchInterestsManagementApp.researchInterestsData
        );
    },
    requestResearchInterestsData: async function () {
        await sendFetchRequest({
            url: `/admin/research_interests_data/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
            },
            callback: ({ admin, research_interests }) => {
                // using the user profile response data, we can save and convert the information into a keyed object
                // and then we can render the datatable for each user using this information and reload each user quickly
                // using the keyed dictionary
                researchInterestsManagementApp.researchInterestsData = research_interests;
                researchInterestsManagementApp.saveResearchInterestsData().then(
                    researchInterestsManagementApp.renderResearchInterestsDataTable
                ).then(
                    ({
                         htmlString,
                         nodeIdentifier,
                         tableIdentifier
                     }) => adminApp.renderDataTable(htmlString, nodeIdentifier, tableIdentifier)
                );
            },
            onFail: (error) => {
                console.error("There was an error retrieving the Research Interests.", error);
            }
        });
    },
    renderResearchInterestsDataTable: async function () {
        // Create the Table header as a JS interpolated string
        const researchInterestTableHeaders = adminApp.createTableRowFromArray([
            'ID',
            'Title',
            'Parent ID',
            'Action',
        ], 'th', 'tr', 'theme-color');
        let researchInterestsTableHTML = `<table id="research-interests-table" class="row-border"><thead>${researchInterestTableHeaders}</thead><tbody>`;

        researchInterestsManagementApp.researchInterestsData.forEach(({ id, title, description, mapping, parent_id }) => {
            // loop over each user in the request and set their info in each table row
            const researchInterestRowData = adminApp.createTableRowFromArray([
                id,
                title,
                parent_id,
                `<button type="button" name="edit-research-interests-action" data-research-interest-id="${id}">Edit</button>`
            ]);
            researchInterestsTableHTML += researchInterestRowData;
        });
        return {
            htmlString: researchInterestsTableHTML + '</tbody></table>',
            nodeIdentifier: 'research-interests-data-table',
            tableIdentifier: 'research-interests-table'
        };
    },
}

document.addEventListener('DOMContentLoaded', researchInterestsManagementApp.init.bind(researchInterestsManagementApp));
