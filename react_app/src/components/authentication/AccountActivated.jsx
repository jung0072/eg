import { Button, Col, Row, Space } from "antd";
import React, { useCallback } from "react";
import { CheckCircleFilled, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Colours, Constants, NotificationTypes, openNotification } from "../utils";
import { useNavigate } from "react-router-dom";
import { useActivateUserAccountMutation } from "../../redux/services/authAPI";

export default function AccountActivated({ shouldActivateAccount, token, setShouldActivateAccount }) {
    const [activateAccount] = useActivateUserAccountMutation();
    const navigate = useNavigate();

    // callback function to show the appropriate toast responses when the user activates their account
    const handleActivateAccountCallback = useCallback(() => {
        activateAccount({ token }).then((apiResponse) => {
            const { data, error } = apiResponse;
            if (error) {
                openNotification({
                    message: "There was an error activating your account",
                    description: error?.data?.error,
                    placement: 'topRight',
                    icon: (<ExclamationCircleOutlined style={{ color: '#FF0000' }} />),
                    type: NotificationTypes.ERROR
                });
            } else if (data) {
                openNotification({
                    message: "Activated Account",
                    description: data.success,
                    placement: 'topRight',
                    callback: null,
                    timeout: 200,
                    icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                });
                setShouldActivateAccount(false);
            }
        }).catch(err => console.error('There was an error activating your account', err));
    }, [activateAccount, token, setShouldActivateAccount]);

    const activationContent = (shouldActivateAccount)
        ? (
            <>
                <ExclamationCircleOutlined style={{ fontSize: '5em', color: Colours.WARNING }} />
                <div style={accountActivatedStyles.title}>Activate your account</div>
                <span style={accountActivatedStyles.description}>{Constants.ACTIVATE_ACCOUNT_DESCRIPTION}</span>
                <Button onClick={handleActivateAccountCallback} style={accountActivatedStyles.SignInButton}>
                    Activate Account
                </Button>
            </>
        )
        : (
            <>
                <CheckCircleFilled style={{ fontSize: '5em', color: Colours.SUCCESS }} />
                <div style={accountActivatedStyles.title}>Your Account is Active</div>
                <span style={accountActivatedStyles.description}>{Constants.ACCOUNT_ACTIVATED_SUCCESSFULLY_DESC}</span>
                <Button style={accountActivatedStyles.SignInButton} onClick={() => navigate('/')}>
                    Sign In
                </Button>
            </>
        );

    return (

        <Row wrap={true} justify={"center"} align={"middle"} style={accountActivatedStyles.container}>
            <Col span={18} justify="center" align="middle">
                <Space direction="vertical">
                    {activationContent}
                </Space>
            </Col>
        </Row>
    );
}

const accountActivatedStyles = {
    container: {
        width: '100%'
    },
    title: {
        fontSize: '3em',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    description: {
        fontSize: '1.5em'
    },
    SignInButton: {
        filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
        backgroundColor: '#002E6D',
        width: '307px',
        height: '58px',
        borderRadius: '75px',
        fontWeight: 700,
        fontSize: '24px',
        color: '#FFFFFF'
    },
};
