import React, { memo, useCallback, useState } from "react";
import { Button, Col, Input, Row, Select, Space, Table, Typography } from "antd";
import { Link } from "react-router-dom";

import { HumanizedUserRoles, TASK_ROLES, USER_PROFILE_ROUTE } from "../../utils/constants.jsx";
import {
    useActivateUserMutation,
    useChangeUserRoleMutation,
    useDeleteUserMutation,
    useGetSystemUsersQuery,
    useResetUserPasswordMutation,
} from "../../../redux/services/adminAPI.js";
import { EngageSpinner, NotificationTypes, openNotification, renderFormErrors } from '../../utils';
import ModalPopup from "../../utils/ModalPopup.jsx";
import {
    CheckCircleOutlined,
    DeleteOutlined, ExclamationCircleOutlined,
    LockOutlined,
    MailTwoTone,
    PoweroffOutlined,
    SwapOutlined,
    UserSwitchOutlined
} from "@ant-design/icons";

const { Title } = Typography;

function UserManagement() {

    const {
        data: systemUserData,
        isLoading
    } = useGetSystemUsersQuery();

    // state variables and setters to show the delete user, change user role and reset user password modals
    const [reqDelete, setReqDelete] = useState({ visible: false, record: null });
    const [reqChangeRole, setReqChangeRole] = useState({ visible: false, record: null });
    // TODO: Will re-enable reset user password once it is required or during the next sprint
    const [reqResetPass, setReqResetPass] = useState({ visible: false, record: null });

    // state to set the value for the role change
    const [modifiedRoleValue, setModifiedRoleValue] = useState(null);

    // Redux mutations to send the request to the backend for delete and change user role
    const [deleteSelectedUser] = useDeleteUserMutation();
    const [changeSelectedUserRole] = useChangeUserRoleMutation();
    const [activateSelectedUser] = useActivateUserMutation();
    const [resetUserPassword, {isLoading: isGeneratingPassword}] = useResetUserPasswordMutation();

    const handleDeleteUserCallback = useCallback((userID) => {
        deleteSelectedUser(userID).then((apiResponse) => {
            const { success, error } = apiResponse.data;
            if (error) {
                renderFormErrors({ data: { error } });
            } else if (success) {
                // show the admin a notification saying the user was deleted and then close the modal
                openNotification({
                    placement: 'topRight',
                    message: `Successfully Deleted User ${userID}`,
                    description: `${success}`,
                    icon: <CheckCircleOutlined style={{ color: 'green' }} />
                });
                setReqDelete({ ...reqDelete, visible: false, record: null });
            }
        });
    }, [setReqDelete]);

    const handleChangeUserRoleCallback = useCallback((userID, newUserRole) => {
        changeSelectedUserRole({
            user_role: newUserRole,
            user_id: userID
        }).then((apiResponse) => {
            const { success, error } = apiResponse.data;
            if (error) {
                openNotification({
                    message: `Error activating User ${userID}!`,
                    description: error,
                    placement: 'topRight',
                    icon: (<ExclamationCircleOutlined style={{ color: '#FF0000' }} />),
                    type: NotificationTypes.ERROR
                });
            } else if (success) {
                // show the admin a notification saying the user was deleted and then close the modal
                openNotification({
                    placement: 'topRight',
                    message: `Successfully Updated the User ${userID} to a ${newUserRole}`,
                    description: `${success}`,
                    icon: <CheckCircleOutlined style={{ color: 'green' }} />
                });
                setReqChangeRole({ ...reqChangeRole, visible: false, record: null });
            }
        });
    }, [systemUserData]);

    const handleActivateUserCallback = useCallback((userID) => {
        activateSelectedUser({ userID }).then((apiResponse) => {
            const { success, error } = apiResponse.data;
            if (error) {
                renderFormErrors({ data: { error } });
            } else if (success) {
                // show the admin a notification saying the user was activated
                openNotification({
                    placement: 'topRight',
                    message: `Successfully Activated the account for User ${userID}`,
                    description: `${success}`,
                    icon: <CheckCircleOutlined style={{ color: 'green' }} />
                });
            }
        }).catch(err => console.error('There was an error activated this user', userID, err));
    });

    const handleReqResetPassword = useCallback((userID) => {
        resetUserPassword({ userID }).then((res) => {
            const { success, error } = res.data;
            if (error) {
                openNotification({
                    placement: 'topRight',
                    message: `An error occurred during the password reset for user ID: ${userID}`,
                    description: `${error}`,
                    icon: <CloseCircleOutlined style={{ color: 'red' }} />
                });
            } else if (success) {
                // show the admin a notification saying the password reset successfully
                openNotification({
                    placement: 'topRight',
                    message: `Generated a new password for User ${userID}`,
                    description: `${success}`,
                    icon: <CheckCircleOutlined style={{ color: 'green' }} />
                });
                setReqResetPass(false);
            }
        }).catch(error => console.log(error, "reset error"))
    })

    // callback functions to handle the changes to a user in the user management panel
    const handleDeleteProfile = useCallback((record) => setReqDelete(
        { ...reqDelete, visible: true, record: record }
    ), [systemUserData]);

    const handleChangeRole = useCallback(record => setReqChangeRole(
        { ...reqChangeRole, visible: true, record: record }
    ), [systemUserData]);

    const handleResetPassword = useCallback((record) => setReqResetPass(
        { ...reqResetPass, visible: true, record: record }
    ), [systemUserData]);

    if (isLoading) {
        return <EngageSpinner display="fullscreen" loaderText="Getting User Data" />;
    }

    const userColumns = [
        {
            title: 'User ID',
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => a.id - b.id
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (_, record) => (
                <Link to={`${USER_PROFILE_ROUTE}${record.id}/`}>
                    {`${record.first_name} ${record.last_name}`}
                </Link>
            ),
            sorter: (a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Button size={'small'} icon={<DeleteOutlined />} onClick={() => handleDeleteProfile(record)}>
                        Delete
                    </Button>
                    <Button size={'small'} icon={<UserSwitchOutlined />} onClick={() => handleChangeRole(record)}>
                        Change Role
                    </Button>
                    <Button size={'small'} icon={<LockOutlined />} onClick={() => handleResetPassword(record)}>
                        Reset Password
                    </Button>
                    {
                        (!record.is_active)
                            ? (
                                <Button
                                    size={'small'}
                                    icon={<PoweroffOutlined />}
                                    onClick={() => handleActivateUserCallback(record.id)}
                                >
                                    Activate
                                </Button>
                            )
                            : null
                    }
                    <a href={`mailto:${record.email}`}>
                        <Button size={'small'} icon={<MailTwoTone />}>
                            Email
                        </Button>
                    </a>
                </Space>
            ),
        },
    ];

    return (
        <div key={"user_management"}>
            <Title level={3}>User Management</Title>
            <Table pagination={{ pageSize: 10 }} dataSource={systemUserData} columns={userColumns} />

            {/* The delete user modal */}
            {reqDelete.visible ? (
                <ModalPopup
                    title="Delete User Account / Profile"
                    visible={reqDelete.visible}
                    handleOk={() => handleDeleteUserCallback(reqDelete.record.id)}
                    handleCancel={() => setReqDelete({ ...reqDelete, visible: false, record: null })}
                    type="info"
                    disableScreenTouch={true}
                    footerButton="Delete Account"
                    centered={true}
                    width={650}
                >
                    <Row align={'center'}>
                        <h1 style={userManagementStyles.warningTitle}>Warning!</h1>
                        <h1 style={userManagementStyles.userDeleteTitle}>
                            Deleting a user means, all their data will be deleted including user profile,
                            projects, task, and their messages. Please confirm the user detail first.
                        </h1>
                    </Row>
                    <Row>
                        <Col span={12}><span style={userManagementStyles.fieldName}>Full Name: </span> <span
                            style={userManagementStyles.fieldValue}>{`${reqDelete.record.first_name} ${reqDelete.record.last_name}`}</span>
                        </Col>
                        <Col span={12}><span style={userManagementStyles.fieldName}>User Email:</span> <span
                            style={userManagementStyles.fieldValue}>{reqDelete.record.email}</span>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}><span style={userManagementStyles.fieldName}>User Role: </span> <span
                            style={userManagementStyles.fieldValue}>{HumanizedUserRoles[reqDelete.record.role]}</span>
                        </Col>
                    </Row>
                </ModalPopup>
            ) : null}

            {/* The change user role popup */}
            {reqChangeRole.visible ? (
                <ModalPopup
                    title="Change User Role"
                    handleCancel={() => setReqChangeRole({ ...reqChangeRole, visible: false, record: null })}
                    visible={reqChangeRole.visible}
                    handleOk={() => handleChangeUserRoleCallback(reqChangeRole.record.id, modifiedRoleValue)}
                    type="info"
                    disableScreenTouch={true}
                    footerButton="Change User Role"
                    centered={true}
                    width={650}
                >
                    <Row>
                        <h1 style={userManagementStyles.userDeleteTitle}>
                            If you modify a user’s role, the questions they filled out in their user profile
                            will be deleted, and they will need to input all their details again.
                        </h1>
                    </Row>
                    <Row>
                        <Col span={8}>
                            <span style={userManagementStyles.fieldName}>From Role(Current):</span>
                            <Input style={{ marginTop: '0.5em' }} disabled={true}
                                value={TASK_ROLES.filter((role) => role.value === reqChangeRole.record.role)[0].label} />
                        </Col>
                        <Col align={'center'} span={8}><SwapOutlined /></Col>
                        <Col span={8}>
                            <span style={userManagementStyles.fieldName}>To Role:</span>
                            <Select
                                onChange={(value) => setModifiedRoleValue(value)}
                                style={{
                                    width: 200,
                                    marginTop: '0.5em'
                                }}
                                options={TASK_ROLES.filter((role) => role.value !== reqChangeRole.record.role)}
                            />
                        </Col>
                    </Row>
                </ModalPopup>
            ) : null}

            {/* reset password modal */}
            {reqResetPass.visible ? (
                <ModalPopup
                    title="Reset User Password"
                    handleCancel={() => setReqResetPass({ ...reqResetPass, visible: false, record: null })}
                    visible={reqResetPass.visible}
                    type="info"
                    handleOk={() => handleReqResetPassword(reqResetPass.record.id)}
                    disableScreenTouch={true}
                    footerButton="Generate New Password"
                    centered={true}
                    width={650}
                    loadingState={isGeneratingPassword}
                >
                    <Row align={"middle"} justify={"center"}>
                        <Col>
                            <Title level={5}>
                            When requesting a password reset, a new password will automatically be generated,
                            rendering the user’s previous password unusable. An email containing the new password
                            will be sent to the user, while administrators will not receive this notification.
                            </Title>
                        </Col>
                    </Row>
                </ModalPopup>
            ) : (null)
            }
        </div >
    );
}

export default memo(UserManagement);

const userManagementStyles = {
    warningTitle: {
        color: 'red',
        textAlign: 'center',
        fontWeight: 'bolder',
    },
    userDeleteTitle: {
        fontSize: '1.2em',
        color: 'var(--primary-color-1)',
    },
    fieldName: {
        fontSize: '1.2em',
        fontWeight: 'bold',
    },
    fieldValue: {
        fontSize: '1.2em'
    }
};
