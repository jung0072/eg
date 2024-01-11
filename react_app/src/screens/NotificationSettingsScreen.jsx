import React, { useContext, useEffect } from 'react';
// import NotificationSettingsContent from '../components/notification_settings/NotificationSettingsContent'
import { useEngageStylingLayout } from '../providers/EngageLayoutStylingContextProvider';
import { Layout, Typography } from 'antd';
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { UnauthenticatedFooter, UnauthenticatedHeader } from "../components/unauthenticated";
import { useSelector } from "react-redux";
import { selectLoggedInUserData } from "../redux/services/userAPI";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

export default function NotificationSettingsScreen({ isUserAuthenticated }) {
    //TODO: Remove content coming soon, once we have confirmed the content from the clients and import the NotificationSettingsContent
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);
    const userInfo = useSelector(selectLoggedInUserData);
    const navigate = useNavigate()

    // useEffect hook for the component did mount life cycle event
    useEffect(() => {
        // remove the padding
        removeLayoutPadding(false);
        // remove the white background color
        changeBackgroundColor(false);
        // reset the navigation context
        updateActiveNavigationMenu('');
        // navigate to the authenticated version
        if (userInfo) {
            navigate('/app/notification_settings');
        }
    }, []);

    return (
        <>
            {!isUserAuthenticated ? <UnauthenticatedHeader /> : null}
            <Layout style={{ padding: (!isUserAuthenticated) ? '1em' : 0 }}>
                <Title>Notification Settings</Title>
                <div>Content coming soon...</div>
                {/* <NotificationSettingsContent /> */}
            </Layout>
            {!isUserAuthenticated ? <UnauthenticatedFooter /> : null}
        </>
    );
}
