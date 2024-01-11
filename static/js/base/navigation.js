const navigationApp = {
    userThemeKey: 'engageUserSelectedTheme',
    themeToggleButton: null,
    init: function (event) {
        // get the theme from local storage and set it on the body element if it exists
        const currentTheme = localStorage.getItem(this.userThemeKey);
        // TODO: Reactivate dark theme by using the current theme if set for document.body.className 'document.body.className'
        // document.body.className = (currentTheme)
        //     ? currentTheme
        //     : 'solar-theme';
        document.body.className = 'solar-theme';

        // set the callback function for the theme toggle button click event
        const themeToggleButton = document.getElementById('theme-toggle-button');
        if (themeToggleButton) {
            this.themeToggleButton = themeToggleButton;
            themeToggleButton.addEventListener('click', this.handleThemeSwitcherClick.bind(this));
        }

        // set the current state for the theme toggle button
        this.switchThemeToggleButtonState(document.body.className);

        // set the mobile switch button
        const sideNavToggleButton = document.getElementById('toggle-nav-button');
        if (sideNavToggleButton) {
            sideNavToggleButton.addEventListener('click', this.handleToggleSideNavigation.bind(this));
        }
    },
    handleThemeSwitcherClick: function (clickEvent) {
        // switch the theme on the body element
        const bodyNode = document.body;
        // toggle the current button from solar to lunar
        bodyNode.className = bodyNode.classList.contains('solar-theme')
            ? 'lunar-theme'
            : 'solar-theme';

        // update the theme chosen in local storage
        localStorage.setItem('engageUserSelectedTheme', bodyNode.className);

        // update the icon and the content for the theme toggle button
        this.switchThemeToggleButtonState(bodyNode.className);
    },
    switchThemeToggleButtonState: function (currentTheme) {
        if (this.themeToggleButton) {
            if (currentTheme === 'solar-theme') {
                this.themeToggleButton.querySelector('i').className = 'fas fa-moon';
                this.themeToggleButton.querySelector('.collapsed-text').textContent = 'Lunar Theme';
            } else {
                this.themeToggleButton.querySelector('i').className = 'fas fa-sun';
                this.themeToggleButton.querySelector('.collapsed-text').textContent = 'Solar Theme';
            }
        }
    },
    handleToggleSideNavigation: function (clickEvent) {
        // get a reference to the current navigation bar, and depending on the state of the active class
        // toggle the button class to show a close or open menu button.
        let currentNavigationState = document.getElementById('main-navigation-bar');
        currentNavigationState.classList.toggle('active');

        if (currentNavigationState.classList.contains('active')) {
            clickEvent.currentTarget.className = 'fas fa-times';
        } else {
            clickEvent.currentTarget.className = 'fas fa-bars';
        }
    },
    convertStringToHTML: (htmlString) => {
        let tempNode = document.createElement('div');
        tempNode.innerHTML = htmlString;
        return (tempNode.childElementCount > 1)
            ? tempNode.children
            : tempNode.firstElementChild;
    }
};

document.addEventListener('DOMContentLoaded', navigationApp.init.bind(navigationApp));
