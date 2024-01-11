import React, { createRef, useCallback, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../../../redux/services/authAPI.js";
import { setCredentials } from "../../../redux/slicers/authSlice.js";
import { renderFormErrors } from "../../utils";
import { Button, Col, Form, Input, Row, Typography } from 'antd';
import EngageLogo from "../EngageLogo";

const { Title } = Typography;

const loginUserStyles = {
    container: {
        fontFamily: 'Inter'
    },
    engageLogo: {
        width: '150px',
        height: '60px',
    },
    tagline: {
        fontWeight: 500,
        fontSize: '18px',
        color: '#494949',
        marginBottom: '69px'
    },
    title: {
        fontWeight: 900,
        fontSize: '50px',
        color: '#000000D9',
        marginBottom: '49px'
    },
    input: {
        width: '486px',
        height: '58px',
        borderRadius: '15px',
        backgroundColor: '#EFEFEF',
        border: 0,
        color: '#727272',
        fontWeight: 500,
        fontSize: '16px'
    },
    signInButton: {
        boxShadow: '0px 4px 4px 0px #00000040',
        width: '227px',
        height: '58px',
        borderRadius: '75px',
        backgroundColor: '#002E6D',
        color: '#FFFFFF',
        fontWeight: '500',
        fontSize: '18px',
    }
};


export default function LoginUserForm() {


    const dispatch = useDispatch();
    const navigate = useNavigate(); // used for navigation to home
    const [login, { isLoading: isLoadingSignUpMutation }] = useLoginMutation(); // rtk helper to post data to login
    const [formError, setFormError] = useState([]);

    // form data that is tracked in a state variable
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const authorizeFormRef = createRef();

    // get the username and password, currently work as default set inside the function
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = useCallback(async () => {
        // First post the user Form Data to the login route and then if successful dispatch the redux event to
        // set the credentials for the user (JWT) and navigate the user to the home page on success
        login({
            username: formData.username.toLowerCase(),
            password: formData.password,
        }).unwrap().then((userData) => {
                dispatch(setCredentials({ ...userData, username: formData.username }));
                return userData;
            }
        ).then(({ redirect_link: redirectLink }) => navigate(redirectLink)
        ).catch(err => renderFormErrors(err, setFormError, "Authentication Failed"));
    });

    return (
        <div style={loginUserStyles.container}>
            <Row style={{ justifyContent: 'center' }}>
                <Col>
                    <EngageLogo styleOverride={{ width: '300px', height: 'auto' }} />
                </Col>
            </Row>
            <Row style={{ justifyContent: 'center' }}>
                <Col span={8}>
                    {/* Replace with tagline once we are given it */}
                    <p></p>
                </Col>
            </Row>
            <Row style={{ justifyContent: 'center' }}>
                <Col>
                    <Title style={loginUserStyles.title}>Sign in to your account</Title>
                </Col>
            </Row>
            <Form onFinish={handleSubmit} ref={authorizeFormRef} className="authorize-user-form">
                <Row style={{ justifyContent: 'center', color: 'red' }}>
                    <Form.ErrorList errors={formError} />
                </Row>
                <Row style={{ justifyContent: 'center' }}>
                    <Col>
                        <Form.Item>
                            <Input name="username" value={formData.username} onChange={handleChange}
                                placeholder={'Username or Email'} style={loginUserStyles.input}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row style={{ justifyContent: 'center' }}>
                    <Col>
                        <Form.Item>
                            <Input type={"password"} name="password" value={formData.password}
                                onChange={handleChange}
                                placeholder={'Password'} style={loginUserStyles.input}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row style={{ justifyContent: 'center' }}>
                    <Col>
                        <Button type="primary" htmlType={'submit'} style={loginUserStyles.signInButton}
                            loading={isLoadingSignUpMutation}
                        >
                            Sign in
                        </Button>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
