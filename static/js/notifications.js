const notifications = {
    // URL for requesting notifications
    apiUrl: "/chat/notifications/json/",

    // How many notifications to load in a single go.
    batchSize: 15,
    currentOffset: 0,

    // Template notification HTML
    notificationHtml: "<li class=\"content-list-item notification-card\">\n" +
        "    <a href=\"{{LINK}}\" class=\"no-decoration\">\n" +
        "        <div class=\"content-card-small\">\n" +
        "            <p class=\"notification-title\">\n" +
        "                <span class=\"card-title\">{{TYPE}}</span>\n" +
        "                {{DATETIME}}\n" +
        "            </p>\n" +
        "            <div class=\"card-content\"><b>{{SOURCE}}</b>: {{CONTENT}}\n" +
        "            </div>\n" +
        "        </div>\n" +
        "    </a>\n" +
        "</li>",

    // Active websocket connection
    socket: null,

    // Called on document load. Binds some extra event listeners and initializes state
    init: function () {
        let otherNotificationsHeader = document.getElementById("other-notifications-header");

        // Open the websocket
        this.socket = new WebSocket(`ws://${window.location.host}/ws/notifications/`);
        this.socket.onmessage = this.notificationReceived.bind(this);

        // If we're on the notifications page set up our handlers for that
        if (otherNotificationsHeader) {
            // Setup some references and listeners
            this.otherNotificationsHeader = otherNotificationsHeader;
            this.filterSearch = document.getElementById("filter-search");
            this.filterType = document.getElementById("filter-type");
            this.otherNotificationsArea = document.getElementById("other-notifications");
            this.filterSearch.addEventListener("input", this.debounceSearch.bind(this));
            this.filterType.addEventListener("input", this.refresh.bind(this));

            // Register a handler for when the user scrolls and if they hit the bottom load more notifications
            window.addEventListener('scroll', () => {
                if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight) {
                    this.loadMore.bind(this)();
                }
            });

            // Fetch the first set of notifications
            this.refresh.bind(this)();
        } else {
            // Otherwise we only want to register a handle to fade out the notifications popup if it's on-screen
            $("#notification-bubble").fadeIn(1000);
            setTimeout(() => {
                $("#notification-bubble").fadeOut(1000);
            }, 2500);
        }

    },

    notificationReceived: function(event) {
        console.log("Received notification: ", event)
    },

    // Called when any of the filters are changed. Re-requests the notifications list with the updated filters.
    refresh: function () {
        // Make an object of the query params we want
        let params = { limit: this.batchSize };
        if (this.filterSearch.value) params.query = this.filterSearch.value;
        if (this.filterType.value) params.type = this.filterType.value;

        // Build the request URL
        let requestUrl = this.buildUrl(params);

        // Make the request
        fetch(requestUrl)
            .then((response) => {
                // Check that we have a successful request and then redraw the notifications
                if (response.status !== 200) {
                    console.log("Error while fetching notifications", response);
                    return;
                }

                // Redraw the whole notifications list
                response.json().then(this.redrawNotifications.bind(this));
            })
            .catch((err) => {
                console.log("Error while fetching notifications", err);
            });
    },

    // Called after refresh has successfully retrieved new notification data
    redrawNotifications: function (data) {
        // Clear the existing date for offset
        this.reachedEnd = false;
        this.currentOffset = 0;

        if (this.paramsCount > 0) {
            this.otherNotificationsHeader.innerText = (this.filterSearch.value !== '')
                ? "Search Results" : "Older Notifications";
            if (data.notifications.length === 0) {
                this.otherNotificationsArea.innerHTML = "<p>No results!</p>";
                return;
            }

        } else {
            this.otherNotificationsHeader.innerText = "Older Notifications";
        }

        let newHtml = "";
        for (let notification of data.notifications.values())
            newHtml += this.renderNotification.bind(this)(notification);

        // Replace existing HTML with it
        this.otherNotificationsArea.innerHTML = newHtml;

        // If we received less than what we asked for, we have hit the bottom
        this.currentOffset = data.notifications.length;
        if (data.notifications.length < this.batchSize)
            this.reachedEnd = true;
    },

    // Called when the page is scrolled nearly to the bottom, and it's time to load more notifications
    loadMore: function () {
        // If we have already hit the end, skip.
        if (this.reachedEnd) return;

        // Make an object of the query params we want
        let params = { offset: this.currentOffset, limit: this.batchSize };
        if (this.filterSearch.value) params.query = this.filterSearch.value;
        if (this.filterType.value) params.type = this.filterType.value;
        let requestUrl = this.buildUrl(params);

        // Make the request
        fetch(requestUrl)
            .then((response) => {
                // Check that we have a successful request and then redraw the notifications
                if (response.status !== 200) {
                    console.log("Error while fetching notifications", response);
                    return;
                }

                // Redraw the whole notifications list
                response.json().then(this.appendNotifications.bind(this));
            })
            .catch((err) => {
                console.log("Error while fetching notifications", err);
            });
    },

    // Called when loading more notifications with the current query
    appendNotifications: function (data) {
        // If we received less than we asked for, we have reached the end.
        if (data.notifications.length < this.batchSize)
            this.reachedEnd = true;

        // Update our current offset
        this.currentOffset += this.batchSize;

        // Append the new notifications to the html
        let newHtml = "";
        for (let notification of data.notifications.values())
            newHtml += this.renderNotification(notification);
        this.otherNotificationsArea.innerHTML += newHtml;
    },

    renderNotification: function (notification) {
        // Format the timestamp
        let date = moment(notification.created_at);
        let timestamp = "";
        if (moment() - date < 1000 * 60 * 60 * 24) timestamp = date.fromNow();
        else timestamp = date.format("YYYY/MM/DD hh:mm A");

        // Construct the html
        return this.notificationHtml
            .replace("{{LINK}}", notification.link)
            .replace("{{TYPE}}", notification.type)
            .replace("{{DATETIME}}", timestamp)
            .replace("{{SOURCE}}", notification.source_name)
            .replace("{{CONTENT}}", notification.content);
    },

    // Used as an intermediary between the search field and the refresh function, so it isn't called while the user is still typing.
    // This will wait 500ms after the last keypress before calling refresh.
    debounceSearch: function (event) {
        // If the timer is currently going, clear it and set it again
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.refresh(event), 500);
    },

    buildUrl: function (params) {
        // Build the request URL
        let requestUrl = this.apiUrl;
        this.paramsCount = Object.keys(params).length;
        if (this.paramsCount > 1) {
            // Build the request URL from the params and the base API URL
            let parts = [];
            for (let param in params) parts.push(param + "=" + encodeURIComponent(params[param]));
            requestUrl = requestUrl + "?" + parts.join("&");
        }

        return requestUrl;
    }
};

document.addEventListener('DOMContentLoaded', notifications.init.bind(notifications));
