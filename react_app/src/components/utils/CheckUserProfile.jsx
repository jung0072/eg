import React, { useState, useEffect } from 'react';
import { Button, Result } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { MINIMUM_REQ_SUBTITLE, MINIMUM_REQ_TITLE } from './constants.jsx';
import { selectUserProfileCheck, userAPI } from '../../redux/services/userAPI';
import { EngageSpinner } from "./engage_spinner/EngageSpinner";
import { useSelector } from "react-redux";
import store from "../../redux/store";


const CheckUserProfile = () => {
    // TODO: Add fetch request to check if minimum requirements are achieved
    const [redirect, setRedirect] = useState(false);
    const location = useLocation();
    const userProfileCompletionCheck = useSelector(selectUserProfileCheck);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userProfileCompletionCheck){
            setLoading(true)
            store.dispatch(userAPI.endpoints.checkUserProfileCompletion.initiate());
        } else {
            setLoading(false)
        }
    }, [userProfileCompletionCheck]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setRedirect(true);
        }, 10000);
        return () => clearTimeout(timeout);
    }, []);

    const handleOkClick = () => {
        setRedirect(true);
    };

    if (loading || !userProfileCompletionCheck) {
        return (<EngageSpinner display="fullscreen" loaderText="Checking profile requirements..."/>);
    }
    const check = (userProfileCompletionCheck.success); // check if user fulfills the minimum requirement criteria

    return check ? (
        <Outlet/>
    ) : (
        <>
            {redirect ? (
                <Navigate to="/edit_profile/" state={{ from: location }}/>
            ) : (
                <Result
                    style={{ height: '89vh' }}
                    status={403}
                    subTitle={MINIMUM_REQ_SUBTITLE}
                    title={MINIMUM_REQ_TITLE}
                    extra={
                        <Button type="primary" onClick={handleOkClick}>
                            I Understand
                        </Button>
                    }
                />
            )}
        </>
    );
};

export default CheckUserProfile;
