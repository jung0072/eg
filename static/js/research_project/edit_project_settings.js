const customizeResearchProjectSettingsFormApp = {
    formNodeIdentifier: "customize-research-project-settings-form",
    formNavNodeIdentifier: "customize-research-project-settings-navigation-bar",
    init: async function (initEvent) {
        // Instantiate an instance of the branching forms app with the form node, form nav node and user id
        // once we request the BranchingPathForms, this will trigger the request and render operations
        const branchingFormsApp = new BranchingFormsApp({
            formNodeId: this.formNodeIdentifier, formNavNodeId: this.formNavNodeIdentifier,
            userId: globalValues.userIdentifier,
            formDataURL: `/app/research_projects/${globalValues.projectIdentifier}/form/`,
            submissionURL: `/app/research_projects/${globalValues.projectIdentifier}/form/`,
            submissionRedirectURL: `/app/research_project/${globalValues.projectIdentifier}/`,
            progressBarID: 'research-project-progress-bar'
        });
        await branchingFormsApp.initialize();
        // create the research project sections first inside our parent form container
        await branchingFormsApp.requestBranchingPathForms();

    },

};

// Set the values for the form node id and the form navigation node id's to the branching forms app before running

document.addEventListener('DOMContentLoaded', customizeResearchProjectSettingsFormApp.init.bind(customizeResearchProjectSettingsFormApp));
