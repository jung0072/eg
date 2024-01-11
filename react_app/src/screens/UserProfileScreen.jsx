import React, { useContext, useEffect } from "react";

import { Col, Layout, Row } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import { selectLoggedInUserData, useGetPublicUserDataQuery } from "../redux/services/userAPI.js";

import { UserProfileHeader } from '../components/user_profile/';
import { UserProfileContents } from '../components/user_profile/';

import { MENU_ROUTES } from "../components/utils/constants";
import { EngageSpinner, NotificationTypes, openNotification } from "../components/utils/";

import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { useEngageStylingLayout } from "../providers/EngageLayoutStylingContextProvider";

export default function UserProfileScreen() {
    const { id: routeID } = useParams();
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);
    const navigate = useNavigate();
    const {
        data: userData,
        isLoading: isLoadingUserData,
        isSuccess: loadedUserProfile,
        isError: isErrorInRetrieving,
        error
    } = useGetPublicUserDataQuery(routeID);
    const currentUserData = useSelector(selectLoggedInUserData);

    useEffect(() => {
        removeLayoutPadding(true);
        changeBackgroundColor(false);
        updateActiveNavigationMenu(MENU_ROUTES[2].key)
        if (isErrorInRetrieving) {
            openNotification({
                message: `Error Retrieving User!`,
                description: `${error?.data?.detail} Redirecting to home.`,
                placement: 'topRight',
                icon: (<ExclamationCircleOutlined style={{ color: '#FF0000' }} />),
                type: NotificationTypes.ERROR,
            });
            setTimeout(() => {
                navigate('/home');
            }, 1000)
        }
    }, [isLoadingUserData]);

    if (isLoadingUserData || !currentUserData) {
        return (<EngageSpinner loaderText={"Loading the User Profile..."} display="fullscreen" />);
    }

    return (
        <Layout className={'user-profile-details-screen'}>
            {loadedUserProfile && <>
                <Row>
                    <Col span={24}>
                        <UserProfileHeader userInfo={userData} currentUserData={currentUserData.user} />
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        <UserProfileContents userInfo={userData} currentUserData={currentUserData.user} />
                    </Col>
                </Row>
            </>
            }
        </Layout>
    );
}
