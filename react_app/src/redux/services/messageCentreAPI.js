import { MESSAGE_CENTRE_ROUTE } from "../api_url";
import { rootAPI } from "./rootAPI.js";

export const messageCentreAPI = rootAPI.injectEndpoints({
    // to get the current user, can be used to display on home screen
    endpoints: builder => ({
        messageCentreData: builder.query({
            query: () => `${process.env.REACT_APP_BASE_URL}${MESSAGE_CENTRE_ROUTE}`
        }),
    })
});

export const {
    useMessageCentreDataQuery
} = messageCentreAPI;
