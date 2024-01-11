const modalApp = {
    init: (ev) => {
        // TODO: initialize any modal buttons to open and close their respective modals
        document.querySelectorAll('.modal-trigger-button').forEach(btn => {
            btn.addEventListener('click', modalApp.handleModalTriggerClick);
        });

        document.querySelectorAll('.modal').forEach(dialog => {
            dialog.addEventListener('click', modalApp.handleModalClose);
        });
        document.querySelectorAll('.modal-exit-button').forEach(dialog => {
            dialog.addEventListener('click', modalApp.handleModalClose);
        });

        // initialize modal tabs to be switched open click, first get all of the modal tab headers
        // add the click event to each tab button inside each header and click the first tab in each modal header
        const modalTabButtonHeaders = document.querySelectorAll('.modal-header-tab-list');
        modalTabButtonHeaders.forEach((modalTabHeader, counter) => {
            const modalTabButtons = modalTabHeader.querySelectorAll('.modal-tab-list-item');
            modalTabButtons.forEach((modalTabBtn, counter) => {
                modalTabBtn.addEventListener('click', modalApp.handleModalTabClick);
                if (counter === 0) {
                    modalTabBtn.click();
                }
            });

        });
    },
    handleModalTriggerClick: (clickEvent) => {
        // using the target modal id, hide all of the modal and show the corresponding modal
        const targetModalId = clickEvent.currentTarget.getAttribute('data-trigger');
        document.querySelectorAll('.modal').forEach(modal => modal.className = 'modal');
        document.getElementById(targetModalId).className = 'modal active';
    },
    handleModalClose: (clickEvent) => {
        // hide all modals if the outside of the modal is clicked
        if (clickEvent.target === clickEvent.currentTarget) {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
        }
    },
    closeAllModals: () => {
        // load all active modals, and remove the active class
        document.querySelectorAll('.modal.active').forEach(modal => modal.classList.remove('active'));
    },
    handleModalTabClick: (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        // first get a reference to the modal that was clicked inside
        if (clickEvent.currentTarget.hasAttribute('data-tab')) {
            const modalId = clickEvent.currentTarget.parentNode.getAttribute('data-modal');
            const targetTab = clickEvent.currentTarget.getAttribute('data-tab');
            const modalNode = document.getElementById(modalId);
            // Now find all of the modal tabs inside the modal, hide them all and then show the corresponding one
            const modalTabs = Array.from(modalNode.querySelectorAll('.modal-tab-content'));
            modalTabs.forEach(tabNode => {
                tabNode.className = 'modal-tab-content';
            });
            document.getElementById(targetTab).classList.add('active');

            // show the clicked tab button as active and the rest as inactive
            document.querySelectorAll('.modal-tab-list-item:not(.modal-exit-button)').forEach(tabButton => {
                tabButton.className = 'modal-tab-list-item';
            });
            clickEvent.currentTarget.classList.add('active');
        }

    }
};

document.addEventListener('DOMContentLoaded', modalApp.init);