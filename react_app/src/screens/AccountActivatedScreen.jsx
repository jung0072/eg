import { Button, Col, Layout, Row } from "antd";
import React, { useEffect, useState } from "react";
import EngageLogo from "../components/authentication/EngageLogo.jsx";

import AccountActivated from "../components/authentication/AccountActivated.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro.js";

export default function AccountActivatedScreen() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [shouldActivateAccount, setShouldActivateAccount] = useState((searchParams.get('should_activate_account') === 'true'));
    const accessToken = searchParams.get('token');
    const homeButtonIcon = (
        <FontAwesomeIcon icon={solid('home')} style={activatedStyles.homeButtonIcon} />
    );

    return (
        <Layout style={activatedStyles.container} className={'register-user-screen'}>
            <Col gutter={[0, 0]} style={activatedStyles.columns.info}>
                <Row style={{ justifyContent: 'center' }}>
                    <EngageLogo styleOverride={activatedStyles.engageLogo} />
                </Row>
            </Col>
            <Col style={activatedStyles.columns.activated}>
                <AccountActivated
                    token={accessToken}
                    shouldActivateAccount={shouldActivateAccount}
                    setShouldActivateAccount={setShouldActivateAccount}
                />
            </Col>
            <Button icon={homeButtonIcon} style={activatedStyles.homeButton} onClick={() => navigate('/')} />
        </Layout>
    );

}

const activatedStyles = {
    container: {
        padding: 0,
        display: 'flex',
        flexFlow: 'row nowrap',
        position: 'relative',
        backgroundColor: '#FFFFFF'
    },
    columns: {
        info: {
            height: '100vh',
            width: '292px',
            borderRadius: '0px',
            backgroundColor: '#E8E8E8',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'scroll'
        },
        activated: {
            width: 'calc(100vw - 292px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: '2em',
            marginTop: '2em',
            overflowY: 'scroll'
        }
    },
    homeButton: {
        border: '0',
        position: 'absolute',
        backgroundColor: 'transparent',
        top: 0,
        right: 0,
        margin: '32px 32px 0 0',
        width: 'auto',
        height: 'auto',
        color: '#7C7C7C'
    },
    homeButtonIcon: {
        fontSize: '46px',
    },
    engageLogo: {
        width: '150px',
        height: '60px',
        marginTop: '50px',
        marginBottom: '30px'
    },
};

