const customizeUserProfileFormApp = {
    formNodeIdentifier: "customize-user-profile-form",
    formNavNodeIdentifier: "customize-user-profile-navigation-bar",
    init: async function (initEvent) {
        // Instantiate an instance of the branching forms app with the form node, form nav node and user id
        // once we request the BranchingPathForms, this will trigger the request and render operations
        this.branchingFormsApp = new BranchingFormsApp({
            formNodeId: this.formNodeIdentifier, formNavNodeId: this.formNavNodeIdentifier,
            userId: globalValues.userIdentifier,
            submissionURL: `/app/profile/edit/`,
            formDataURL: `/app/profile/edit/form`,
            submissionRedirectURL: `/app/profile/${globalValues.userIdentifier}`,
            injectedFormNodeIdentifier: 'basic-profile-settings-form',
            progressBarID: (globalValues.currentUserRole === 'RESEARCHER') ?  'researcher-progress-bar' : null
        });
        await this.branchingFormsApp.initialize();
        // create the user profile sections first inside our parent form container
        await this.branchingFormsApp.requestBranchingPathForms();
    },

};

// Set the values for the form node id and the form navigation node id's to the branching forms app before running

document.addEventListener('DOMContentLoaded', customizeUserProfileFormApp.init.bind(customizeUserProfileFormApp));
