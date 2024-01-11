const toastApp = {
    init: () => {},
    createNotification: (type = 'success', title = '', content = '', callback = () => null, time = new Date()) => {
        // before creating the toast notification, check if we have a container on the page already
        // if we do continue as normal, if not create and append the container to the page
        const existingToastContainer = document.querySelector('.toast-notification-container');
        const mainElement = document.querySelector('main');
        let toastContainer;
        if (existingToastContainer) {
            toastContainer = existingToastContainer;
        } else {
            toastContainer = navigationApp.convertStringToHTML(
                '<div class="toast-notification-container"><section class="toast-notification-group"></section></div>'
            );
            mainElement.appendChild(toastContainer);
        }

        // now create the different parts of the toast message
        let toastList = toastContainer.querySelector('section');
        const toastOutput = navigationApp.convertStringToHTML(
            `<output role="status" class="toast-notification ${type}"></output>`
        );
        const toastHeader = navigationApp.convertStringToHTML(
            `<div class="toast-header">
                            <span class="toast-icon"></span>
                      </div>`
        );
        toastHeader.appendChild(navigationApp.convertStringToHTML(
            `<div class="toast-title">${title}</div>`
        ));
        // format the date to a string before setting it to the html container
        toastHeader.appendChild(navigationApp.convertStringToHTML(
            `<div class="toast-time">${time.toLocaleTimeString()}</div>`
        ));
        const toastContent = navigationApp.convertStringToHTML(
            `<div class="toast-content">${content}</div>`
        );

        // append the toast header and content to the output and then to the container to add to the page
        toastOutput.appendChild(toastHeader);
        toastOutput.appendChild(toastContent);
        toastList.appendChild(toastOutput);

        // set a timeout to remove the toast notification after 3 seconds, and if its the last
        // notification remove the container as well
        setTimeout(() => {
            toastList.removeChild(toastOutput);
            if (toastList.children.length <= 0) {
                mainElement.removeChild(toastContainer);
            }
            // run the callback function once the toast notification completes
            callback();
        }, 3000);
    },
};

document.addEventListener('DOMContentLoaded', toastApp.init);
