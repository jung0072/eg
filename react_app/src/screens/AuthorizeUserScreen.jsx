import React, { useCallback, useContext, useEffect, useState } from "react";
import { Button, Col, Form, Input, Layout, Row, Tooltip, Typography } from "antd";
import { LoginUserForm } from "../components/authentication/";
import { useNavigate } from "react-router-dom";
import ModalPopup from "../components/utils/ModalPopup";
import {
    useCheckPlatformStatusQuery,
    useResendActivationEmailMutation,
    useResetPasswordMutation
} from "../redux/services/authAPI";
import { openNotification, renderFormErrors } from "../components/utils";
import { CheckCircleOutlined } from "@ant-design/icons";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import InsightScopeLogo from "../imgs/colour-logo.png";
import SVGToImageConverter from "../components/utils/SVGToImageConverter";

import "../components/authentication/auth_screen.css";

const { Title, Text } = Typography;

const authorizeUserStyles = {
    container: {
        padding: 0,
        display: 'flex',
        flexFlow: 'row nowrap',
        position: 'relative',
        backgroundColor: '#FFFFFF'
    },
    columns: {
        form: {
            width: 'calc(100vw - 517px)',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        },
        info: {
            height: '100vh',
            width: '517px',
            borderRadius: '0px',
            backgroundColor: '#002E6D',
            display: 'flex',
            flexDirection: 'column',
        }
    },
    registerTitle: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: '50px',
        textAlign: 'center',
        marginTop: '30vh'
    },
    registerSubtitle: {
        color: '#FFFFFF',
        fontSize: '24px',
        fontWeight: 500,
        textAlign: 'center'
    },
    registerButton: {
        boxShadow: '0px 4px 4px 0px #00000040',
        backgroundColor: '#FFFFFF',
        color: '#7C7C7C',
        height: '58px',
        width: '227px',
        borderRadius: '75px',
        marginTop: '70px',
        fontWeight: '600',
        fontSize: '18px',
    },
    partnerRegistrationButton: {
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: '0.6rem',
        boxShadow: '0px 4px 4px 0px #00000040',
        backgroundColor: '#FFFFFF',
        color: '#7C7C7C',
        height: '58px',
        minWidth: '227px',
        borderRadius: '75px',
        fontSize: '18px',
        fontWeight: '600',
    },
    registerWith: {
        fontSize: '18px',
        color: '#FFF',
    },
    popupLinks: {
        marginTop: '1em',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer'
    }
};

export default function AuthorizeUserScreen() {

    const [isPopupVisible, setIsPopupVisible] = useState({
        active: false,
        type: {
            passwordReset: false,
            resendEmailConfirmation: false
        }
    });
    // check the status of insight scope and disable button accordingly
    const [isInsightScopeDown, setIsInsightScopeDown] = useState(
        { down_status: false, message: '' }
    );

    const [formRef] = Form.useForm();
    const navigate = useNavigate();
    const [resetPassword] = useResetPasswordMutation();
    const [resendActivationEmail] = useResendActivationEmailMutation();
    const { data: platformStatusData, isLoading: isCheckingStatus } = useCheckPlatformStatusQuery();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);
    // useEffect hook for component did mount life cycle event, we should reset the current nav context
    useEffect(() => {
        updateActiveNavigationMenu('');
        if (platformStatusData) {
            const { success, error } = platformStatusData;
            if (error) {
                setIsInsightScopeDown({
                    ...isInsightScopeDown,
                    down_status: error.down_status,
                    message: error.message
                });
            }
        }
    }, [platformStatusData]);

    const handleOk = useCallback(() => {
        const email = formRef.getFieldsValue();
        const isPasswordResetModal = isPopupVisible.type.passwordReset;
        (isPasswordResetModal ? resetPassword(email) : resendActivationEmail(email))
            .then(({ data, error }) => {
                const description = data?.success?.message;
                const isActiveUser = data?.success?.isActive;
                if (data) {
                    openNotification({
                        message: isActiveUser ? 'Account Already Activated' : 'Email Sent',
                        description: `${description}${isPasswordResetModal ? `; requested email for password reset is: ${email.email}` : ''}`,
                        placement: 'topRight',
                        timeout: 6400,
                        icon: <CheckCircleOutlined style={{ color: 'green' }} />,
                    });
                    setIsPopupVisible({
                        ...isPopupVisible,
                        active: false,
                        type: {
                            ...isPopupVisible.type,
                            passwordReset: false,
                            resendEmailConfirmation: false
                        }
                    });
                    formRef.resetFields();
                }
                if (error) {
                    renderFormErrors(error, null, "Rate limit exceeded", 9000);
                    setIsPopupVisible({
                        ...isPopupVisible,
                        active: false,
                        type: {
                            ...isPopupVisible.type,
                            passwordReset: false,
                            resendEmailConfirmation: false
                        }
                    });
                }
            });
    }, [formRef, isPopupVisible, resetPassword, resendActivationEmail]);

    const handleCancel = () => {
        setIsPopupVisible({
            ...isPopupVisible,
            active: false,
            type: {
                ...isPopupVisible.type,
                passwordReset: false,
                resendEmailConfirmation: false
            }
        });
    };

    const handlePopup = (passwordReset, resendActivation) => {
        setIsPopupVisible({
            ...isPopupVisible,
            active: true,
            type: {
                ...isPopupVisible.type,
                passwordReset: passwordReset,
                resendEmailConfirmation: resendActivation
            }
        });
    };

    return (
        <Layout style={authorizeUserStyles.container} className={'authorize-user-screen'}>
            <Col gutter={[0, 0]} style={authorizeUserStyles.columns.form}>
                <LoginUserForm />
                <Row justify={"center"} align={"middle"}>
                    {
                        (isPopupVisible.active)
                            ? <ModalPopup
                                title={isPopupVisible.type.passwordReset ? "Reset Your Password" : "Resend Activation Email"}
                                visible={isPopupVisible.active}
                                handleOk={() => formRef.submit()}
                                handleCancel={handleCancel}
                                type="info"
                                disableScreenTouch={true}
                                footerButton={isPopupVisible.type.passwordReset ? "Reset my password" : "Resend Email"}
                                centered={true}
                                width={650}
                            >
                                <Form form={formRef} onFinish={handleOk}>
                                    <div style={{ padding: '1em 0' }}>
                                        Enter your email
                                        address {isPopupVisible.type.resendEmailConfirmation && "or username"}:
                                    </div>
                                    <Form.Item
                                        rules={[{ required: true }]}
                                        name={isPopupVisible.type.passwordReset ? "email" : "username_or_email"}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Form>
                            </ModalPopup>
                            : ""
                    }
                </Row>
                <Row style={{ gap: '1rem' }}>
                    <Text
                        onClick={() => handlePopup(true, false)}
                        style={authorizeUserStyles.popupLinks}
                    >
                        Forgot Password?
                    </Text>
                </Row>
                <Row>
                    <Text
                        onClick={() => handlePopup(false, true)}
                        style={authorizeUserStyles.popupLinks}
                    >
                        Resend Activation Email
                    </Text>
                </Row>
            </Col>
            <Col gutter={[0, 0]} style={authorizeUserStyles.columns.info}>
                <Row style={{ justifyContent: 'center' }}>
                    <Title style={authorizeUserStyles.registerTitle}>New Here?</Title>
                </Row>
                <Row>
                    <Title style={authorizeUserStyles.registerSubtitle} level={3}>
                        Register and discover a new world of possibilities
                    </Title>
                </Row>
                <Row style={{ justifyContent: 'center' }}>
                    <Button style={authorizeUserStyles.registerButton}
                        onClick={() => navigate('/registration/')}
                    >
                        Registration
                    </Button>
                </Row>
                <Col id="signup-platforms" align={"middle"} justify={"center"} gutter={30} style={{ margin: '1rem 0' }}>
                    <Col span={24}>
                        <Title style={authorizeUserStyles.registerWith} level={5}>or register with</Title>
                    </Col>
                    <Col>
                        <Tooltip id="tooltip-button" title={isInsightScopeDown.message} placement="top">
                            <Button
                                loading={isCheckingStatus}
                                disabled={isInsightScopeDown.down_status}
                                className="insightScope-button"
                                onClick={() => navigate('/register_from_platform/insightScope/')}
                                type="primary"
                                style={authorizeUserStyles.partnerRegistrationButton}
                                icon={
                                    <SVGToImageConverter
                                        styleOverride={{ height: "30px", width: "30px" }}
                                        alt={"Insight Scope Logo"} logo={InsightScopeLogo}
                                    />
                                }
                            >
                                insightScope
                            </Button>
                        </Tooltip>
                    </Col>
                </Col>
            </Col>
        </Layout>
    );
}
