import React, { useContext, useEffect, useState } from 'react';
import { CheckCircleOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Form, Button, Input, Col, Row, Checkbox } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCheckResetPasswordTokenQuery, useConfirmResetPasswordMutation } from '../redux/services/authAPI';
import { openNotification, renderFormErrors } from '../components/utils';
import { useParams } from "react-router-dom";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";

const { Item } = Form;

export default function ChangeUserPasswordScreen() {
	const navigate = useNavigate();
	const [form] = Form.useForm();
	
	const { uidb64, token  } = useParams()
	const [confirmResetPassword, {isLoading: loadingResetRequest}] = useConfirmResetPasswordMutation();
	const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);
    const [formError, setFormError] = useState([])
	const [passwordErrors, setPasswordErrors] = useState({
		minLength: false,
		upperCase: false,
		lowerCase: false,
		number: false,
		passMatch: false,
	});
	const { data, isLoading, error } = useCheckResetPasswordTokenQuery({
		token,
		uidb64,
	});

	// useEffect hook for component did mount life cycle event, we should reset the current nav context
    useEffect(() => updateActiveNavigationMenu(''), [])

	if (!isLoading) {
		if (error?.status === 403) navigate('/');
	}

	function handleSubmit(values) {
		const resetFormData = {
			...values,
			token: token,
			encoded_user_id: uidb64,
		};
		if (!Object.values(passwordErrors).includes(false)) {
			confirmResetPassword(resetFormData).then(({ data, error }) => {
				if (data) {
					openNotification({
						message: 'Password Reset Successfully',
						description: `${data.success.message}`,
						placement: 'top',
						timeout: 1000,
						icon: (
							<CheckCircleOutlined style={{ color: 'green' }} />
						),
					});
					setTimeout(() => {
						navigate('/');
					}, 1400);
				}
				if (error) {
					renderFormErrors(
						error,
						setFormError,
						'Error saving form data'
					);
				}
			});
		}
	}

	const validatePassword = (_, value) => {
		if (!/[A-Z]/.test(value)) {
			return Promise.reject();
		}
		if (!/[a-z]/.test(value)) {
			return Promise.reject();
		}
		if (!/\d/.test(value)) {
			return Promise.reject();
		}
		if (value.length < 8) {
			return Promise.reject();
		}

		return Promise.resolve();
	};

	function handlePassword(e) {
		const value = e.target.value;
		const newPassErrors = {
			minLength: value.length >= 8,
			upperCase: /[A-Z]/.test(value),
			lowerCase: /[a-z]/.test(value),
			number: /\d/.test(value),
			passMatch: passwordErrors.passMatch,
		};
		setPasswordErrors(newPassErrors);
	}

	function handleConfirmPassword(e) {
		const value = e.target.value;
		const confirmPassErrors = {
			minLength: passwordErrors.minLength,
			upperCase: passwordErrors.upperCase,
			lowerCase: passwordErrors.lowerCase,
			number: passwordErrors.number,
			passMatch:
				value === form.getFieldValue('new_password1') &&
				value.length > 0,
		};
		setPasswordErrors(confirmPassErrors);
	}

	return (
		<Col style={changeUserPasswordStyles.content}>
			<h1 style={changeUserPasswordStyles.headingColor}>
				Reset your password
			</h1>
			<Row style={changeUserPasswordStyles.checkboxContainer}>
				<Checkbox style={changeUserPasswordStyles.firstCheck} checked={passwordErrors.upperCase}>
					Password must contain at least one uppercase letter.
				</Checkbox>
				<Checkbox checked={passwordErrors.lowerCase}>
					Password must contain at least one lowercase letter.
				</Checkbox>
				<Checkbox checked={passwordErrors.number}>
					Password must contain at least one number.
				</Checkbox>
				<Checkbox checked={passwordErrors.minLength}>
					Password must be at least 8 characters long.
				</Checkbox>
				<Checkbox checked={passwordErrors.passMatch}>
					Password should match
				</Checkbox>
			</Row>
			<Form	layout='vertical' form={form} style={changeUserPasswordStyles.formStyle}
					onFinish={handleSubmit}
			>
				<Row style={{ justifyContent: 'center', color: 'red' }}>
					<Form.ErrorList errors={formError} />
				</Row>
				<Item
					style={changeUserPasswordStyles.labelStyle}
					name={'new_password1'}
					label='New Password'
					rules={[
						{
							required: true,
							message: 'Please input your password!',
						},
                        {
                            validator: validatePassword
                        },
					]}
				>
					<Input.Password
						onChange={handlePassword}
						placeholder='Input your new password'
						iconRender={(visible) =>
							visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
						}
					/>
				</Item>
				<Item
					dependencies={['new_password1']}
					style={changeUserPasswordStyles.labelStyle}
					name={'new_password2'}
					hasFeedback
					label='Confirm New Password'
					rules={[
						{
							required: true,
							message: 'Please confirm your password!',
						},
						({ getFieldValue }) => ({
							validator(_, value) {
								if (getFieldValue('new_password1') === value &&
									!Object.values(passwordErrors).includes(false)
								) {
									return Promise.resolve();
								}
								return Promise.reject(
									new Error(
										'The two passwords that you entered do not match!'
									)
								);
							},
						}),
                        {
                            validator: validatePassword
                        },
					]}
				>
					<Input.Password
						onChange={handleConfirmPassword}
						placeholder='Confirm password'
						iconRender={(visible) =>
							visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
						}
					/>
				</Item>
				<Item>
					<Button
						loading={loadingResetRequest}
						style={changeUserPasswordStyles.buttonStyle}
						type='primary'
						htmlType={'submit'}
					>
						Submit
					</Button>
				</Item>
			</Form>
		</Col>
	);
}

const changeUserPasswordStyles = {
    content: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        paddingTop: '1em',
    },
    labelStyle: {
        fontSize: '22px',
        fontWeight: '500',
        marginBottom: '7px'
    },
    formStyle: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1em'
    },
    buttonStyle: {
        boxShadow: '0px 4px 4px 0px #00000040',
		width: '120px',
		height: '38px',
		borderRadius: '75px',
		backgroundColor: '#002E6D',
		color: '#FFFFFF',
		fontWeight: '500',
		fontSize: '16px',
	},
	headingColor: {
		color: '#002E6D',
	},
	checkboxContainer: {
		flexDirection: 'column',
		alignItems: 'flexStart',
		textAlign: 'left',
		margin: 0,
	},
	firstCheck: {
		marginLeft: '8px',
	},
};
