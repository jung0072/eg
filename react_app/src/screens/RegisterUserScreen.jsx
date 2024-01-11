import React, { useContext, useEffect } from "react";
import { Button, Col, Row, Image, Layout, Form } from "antd";
import { RegisterUserForm } from "../components/authentication/";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { useNavigate } from "react-router-dom";
import { EngageLogo } from "../components/authentication/";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";

const registrationStyles = {
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
        form: {
            width: 'calc(100vw - 292px)',
            height: '100%',
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

export default function RegisterUserScreen() {
    const navigate = useNavigate();
    const [formHook] = Form.useForm();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);
    const homeButtonIcon = (
        <FontAwesomeIcon icon={solid('home')} style={registrationStyles.homeButtonIcon}/>
    );

    // useEffect hook for component did mount life cycle event, we should reset the current nav context
    useEffect(() => updateActiveNavigationMenu(''), [])

    return (
        <Layout style={registrationStyles.container} className={'register-user-screen'}>
            <Col gutter={[0, 0]} style={registrationStyles.columns.info}>
                <Row style={{ justifyContent: 'center' }}>
                    <EngageLogo styleOverride={registrationStyles.engageLogo}/>
                </Row>
                <Row style={{ justifyContent: 'center' }}>
                    <p style={{ textAlign: 'center' }}> </p>
                </Row>
            </Col>
            <Col gutter={[0, 0]} style={registrationStyles.columns.form}>
                <RegisterUserForm formHook={formHook} />
            </Col>
            <Button icon={homeButtonIcon} style={registrationStyles.homeButton} onClick={() => navigate('/')}/>
        </Layout>
    );
}
