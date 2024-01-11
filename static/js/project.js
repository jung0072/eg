const projectView = {
    init: function (event) {
        const viewMoreLink = document.getElementById('view-more-link');
        viewMoreLink.addEventListener('click', this.handleViewMoreClick.bind(this));
    }, handleViewMoreClick: function (event) {
        event.preventDefault();

        const moreUsers = document.querySelectorAll('.view-more');
        const viewLess = document.getElementById('view-less');

        for (let i = 0; i < moreUsers.length; i++) {
            moreUsers[i].classList.remove('view-more');
        }

        viewLess.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', projectView.init.bind(projectView));