import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import store from "../../redux/store";
import { userAPI } from "../../redux/services/userAPI";

const RequireAuth = () => {

    //check if we have a token
    const token = sessionStorage?.getItem("access");
    const location = useLocation();

    // useEffect hook to listen to the history and scroll the user to the top of the page when they change components
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, [location]);

    useEffect(() => {
        // Whenever the auth_token changes, lets fire off the requests for the various pieces of user data
        store.dispatch(userAPI.endpoints.getUserData.initiate());
        store.dispatch(userAPI.endpoints.getUserProfileFormValues.initiate());
        store.dispatch(userAPI.endpoints.getUserNotifications.initiate());
        store.dispatch(userAPI.endpoints.checkUserProfileCompletion.initiate());
        // store.dispatch(userAPI.endpoints.communityListFilters.initiate());
    }, [token]);

    return token ? <Outlet /> : <Navigate to="/" state={{ from: location }} />;
};

export default RequireAuth;
