const userProfileSettingsApp = {
    init: function (initEvent) {
        console.log("The user profile settings script is loaded", initEvent);
    },
};

document.addEventListener('DOMContentLoaded', userProfileSettingsApp.init.bind(userProfileSettingsApp));
