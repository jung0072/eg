import React, { useState } from 'react';
import { Button, Col, Form, Layout, Row, Typography, Input } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

import "./insight_scope_auth.css";

import { useNavigate } from 'react-router';

import { Constants, openNotification } from '../../utils/index.js';
import SelectEngageRoleInput from '../../utils/SelectEngageRoleInput.jsx';
import SVGToImageConverter from '../../utils/SVGToImageConverter.jsx';
import ModalPopup from "../../utils/ModalPopup.jsx";

import insightScopeLogo from "../../../imgs/insightScope-full-colour-logo.png";

import { useSignupWithInsightScopeMutation } from '../../../redux/services/authAPI.js';

const { Title } = Typography;

export default function InsightScopeAuth() {

    // state for success modal
    const [isAccountCreatedModal, setIsAccountCreatedModal] = useState(false);
    // insight scope form instance
    const [insightScopeForm] = Form.useForm();
    
    // rtk query to submit the form
    const [signupInsightScope, { isLoading: isLoadingSignup }] = useSignupWithInsightScopeMutation();
    
    const navigate = useNavigate();

    const handleOk = () => {
        navigate('/');
    };

    const onInsightScopeSignup = () => {
        signupInsightScope(insightScopeForm.getFieldsValue()).then((res) => {
            const { success, error } = res.data;
            if (success) {
                setIsAccountCreatedModal(true);
            } else {
                openNotification({
                    message: "There was an error encountered during the signup process.",
                    description: error,
                    placement: 'topRight',
                    timeout: 200,
                    icon: (<CloseCircleOutlined style={{ color: 'red' }}/>),
                });
            }
        })
    }

    return (
        <Row id='insightScope-auth' style={insightScopeAuthStyle.content}>
            <Row>
                <SVGToImageConverter
                    styleOverride={{ height: "80px", width: "auto" }}
                    alt={"Insight Scope Logo"} logo={insightScopeLogo}
                />
            </Row>
            <Row span={24}>
                <Title level={3}>Enter your insightScope credentials</Title>
            </Row>
            <Row className='form-container'>
                <Form
                    form={insightScopeForm}
                    onFinish={onInsightScopeSignup}
                    className='auth-form' layout="vertical"
                    name="loginForm" autoComplete="on"
                >
                    <Row style={{ justifyContent: 'center', color: 'red' }}>
                    </Row>
                    <Form.Item label="Username" name="username" labelCol={24} wrapperCol={24}
                        rules={[
                            {
                                required: true,
                                message: 'Please enter your username!',
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item label="Password" name="password" labelCol={24} wrapperCol={24}
                        rules={[
                            {
                                required: true,
                                message: 'Please enter your password!',
                            },
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Col span={24}>
                        <SelectEngageRoleInput isInsightScopeAuth />
                    </Col>
                    <Row justify={"center"}>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" className='signup-button' loading={isLoadingSignup}>
                                Sign Up
                            </Button>
                        </Form.Item>
                    </Row>
                </Form>
            </Row>
            {
                (isAccountCreatedModal)
                    ? <ModalPopup
                        title="Your Account has been created!"
                        visible={isAccountCreatedModal}
                        handleOk={handleOk}
                        closable={false}
                        type="success"
                        disableScreenTouch={true}
                        footerButton="Sign In"
                        centered={true}
                        width={1000}
                    >
                        <p>{Constants.ACC_SUCCESSFULLY_CREATED_INSIGHTSCOPE}</p>
                    </ModalPopup>
                    : ""
            }
        </Row>
    );
}

const insightScopeAuthStyle = {
    content: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        flexDirection: 'column',
        gap: '1.5rem',
    }
}
