const adminApp = {
    init: function () {
        // find all of the side content buttons and add the handleSideContentSwitch callback
        document.querySelectorAll('.side-button[data-selector]').forEach(sideButtonNode => {
            sideButtonNode.addEventListener('click', this.handleSideContentSwitch);
        });
    },
    handleSideContentSwitch(clickEvent) {
        const targetNodeId = clickEvent.currentTarget.getAttribute('data-selector');
        const correspondingNode = document.getElementById(targetNodeId);

        // Hide all of the page content nodes and then show the corresponding node to the clicked button
        document.querySelectorAll('.page-content').forEach(pageItems => pageItems.className = 'page-content hidden');
        correspondingNode.classList.remove('hidden');

        // Show the new page titles
        let newTitleArray = targetNodeId.split('_');
        newTitleArray = newTitleArray.map(word => {
            return word[0].toLocaleUpperCase() + word.substring(1);
        });
        document.getElementById('page-header-title').textContent = `Administration - ${newTitleArray.join(' ')}`;

        // scroll to the top of the page TODO: remove this when media queries are added to fit side content to page
        window.scrollTo({top: 0, behavior: 'smooth'});
    },
    convertToKeyedObjectDict: async function (userModelList) {
        // using an empty object, we are going to save the values of each section keyed to their id's to quickly retrieve info
        // if the supplied user model list has an attribute for id, this will reindex the object under the keys
        const keyedUserModelData = {};
        userModelList.forEach(data => {
            // spread the attributes of each section into the new key
            keyedUserModelData[`${data.id}`] = {
                ...data
            };
        });
        return keyedUserModelData;
    },
    renderDataTable: function (
        htmlString, nodeIdentifier = "customize-user-profile-questions-table",
        tableIdentifier = "user-profile-questions-table"
    ) {
        // Create the User Profile Table out of HTML elements in an interpolated string
        // Than using the datable library instantiate the DataTable
        const userProfileTableContainer = document.getElementById(nodeIdentifier);
        userProfileTableContainer.innerHTML = "";
        const userProfileQuestionTableNode = navigationApp.convertStringToHTML(htmlString);
        userProfileTableContainer.appendChild(userProfileQuestionTableNode);

        //instantiate the datatable and set the options required
        new DataTable(`#${tableIdentifier}`, {
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]]
        });

        // change any datatable properties after it is set up
    },
    createTableRowFromArray: (rowDataList, elementTag = 'td', containerTag = 'tr', className = '') => {
        // Map over the supplied array element and add the element tags to each item of the array
        // then return an interpolated string containing all of the array elements inside of the container tag
        const rowDataHTML = rowDataList.map((rowData) => `<${elementTag}>${rowData}</${elementTag}>`).join('');
        return `<${containerTag} class="${className}">${rowDataHTML}</${containerTag}>`;
    },
    showToastResponse: (clickEvent, onSuccessCallBack) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        const resourcePath = clickEvent.currentTarget.href;
        sendFetchRequest({
            url: resourcePath,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
                'Accept': 'application/json',
            },
            callback: async ({success: successMessage}) => {
                // TODO: bug related to this event not reloading the table
                toastApp.createNotification('success', 'The request was sent', successMessage, () => {
                    return onSuccessCallBack().catch(error => console.error(error))
                });
            },
            onFail: ({error: errorMessage}) => {
                toastApp.createNotification('error', 'Error Occurred', errorMessage);
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', adminApp.init.bind(adminApp));
