import React, { useContext, useEffect } from 'react';
// import PrivacyPolicyContent from '../components/privacy_policy/PrivacyPolicyContent';
import { useEngageStylingLayout } from '../providers/EngageLayoutStylingContextProvider';
import { Layout, Typography } from 'antd';
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { UnauthenticatedFooter, UnauthenticatedHeader } from "../components/unauthenticated";
import { useSelector } from "react-redux";
import { selectLoggedInUserData } from "../redux/services/userAPI";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

export default function PrivacyPolicyScreen({ isUserAuthenticated }) {
    //TODO: Remove content coming soon, once we have confirmed the content from the clients and import the PrivacyPolicyContent
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);
    const userInfo = useSelector(selectLoggedInUserData);
    const navigate = useNavigate();

    //useEffect hook for the component did mount lifecycle event
    React.useEffect(() => {
        // remove the padding
        removeLayoutPadding(false);
        // remove the white background color
        changeBackgroundColor(false);
        // reset the navigation context
        updateActiveNavigationMenu('');
        // navigate to the authenticated version
        if (userInfo) {
            navigate('/app/privacy_policy/');
        }
    }, []);

    return (
        <>
            {!isUserAuthenticated ? <UnauthenticatedHeader /> : null}
            <Layout style={{ padding: (!isUserAuthenticated) ? '1em' : 0 }}>
                <Title>Privacy Policy</Title>
                <div>Content coming soon...</div>
                {/* <PrivacyPolicyContent /> */}
            </Layout>
            {!isUserAuthenticated ? <UnauthenticatedFooter /> : null}
        </>
    );
}
