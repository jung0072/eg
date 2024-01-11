const researchProjectTaskDetailsApp = {
    init: () => {
        console.log("research project task details script loaded");
        // initialize the datatable for the protocol files table and the user submitted files table
        new DataTable(document.getElementById('user-submitted-files-table'), {
            searching: false, paging: false, bInfo: false
        })
        new DataTable(document.getElementById('protocol-files-table'), {
            searching: false, paging: false, bInfo: false
        })
    }
};

document.addEventListener('DOMContentLoaded', researchProjectTaskDetailsApp.init.bind(researchProjectTaskDetailsApp));
