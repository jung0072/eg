import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import { selectLoggedInUserData } from "../../redux/services/userAPI";
import { EngageSpinner } from "./engage_spinner/EngageSpinner";

/**
 * Component that requires the user to be an admin to access its child routes.
 * If the user is not an admin, it navigates back to the home page.
 * @returns {JSX.Element} The component's UI.
*/
const RequireAdmin = () => {

    // get the logged in user info
    const userInfo = useSelector(selectLoggedInUserData);
    const location = useLocation();
    // useEffect hook to listen to the history and scroll the user to the top of the page when they change components
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, [location]);

    // set the dependency to userInfo
    useEffect(() => {
    }, [userInfo])

    /**
     * Render the component's UI.
     * @returns {JSX.Element} The component's UI.
     */
    if (!userInfo) {
        return <EngageSpinner />
    } else {
        return userInfo.user.is_admin ? <Outlet /> : <Navigate to="/home/" state={{ from: location }} />;
    }
};

export default RequireAdmin;
