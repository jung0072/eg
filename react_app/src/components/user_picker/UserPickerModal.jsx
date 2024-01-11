import React, { useCallback, useState } from 'react';
import { Avatar, Button, Empty, List, Modal, Typography } from "antd";
import UserSearchBox from './UserSearchBox';
import Link from 'antd/lib/typography/Link';
import './user_picker.css';
import UserDirectoryModal from './UserDirectoryModal';
import { useAddUserToProjectMutation } from "../../redux/services/researchProjectAPI";
import { openNotification, renderFormErrors } from "../utils";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import SelectEngageRoleInput from "../utils/SelectEngageRoleInput";

const { Text, Title } = Typography;

const userPickerModalStyles = {
    container: {
        borderRadius: '10px'
    },
    listContainer: {
        maxHeight: '50vh',
        overflowY: 'scroll'
    },
    title: {
        fontSize: '24px',
        color: '#002E6D',
        fontWeight: 600,
    },
    paragraph: {
        fontWeight: 200,
        marginBottom: '1em',
    },
    listTitle: {
        display: 'inline-block'
    },
    searchBox: {
        width: '100%'
    }
};

export default function UserPickerModal({
                                            modalTitle = "Select users",
                                            onUsersSelected,
                                            excludeUsers = [],
                                            IsAddUserModalVisible,
                                            setIsAddUserModalVisible,
                                            projectID
                                        }) {
    // User related stuff
    const [selectedUsers, setSelectedUsers] = useState([]);
    const addUserToList = (user) => {
        // Skip adding the user if they're already in the list
        if (selectedUsers.some(u => u.id === user.id)) return;

        // Update the selected users state
        setSelectedUsers([...selectedUsers, user]);
    };
    const removeUserFromList = (user) => setSelectedUsers(selectedUsers.filter(x => x.id !== user.id));

    const [useDirectory, setUseDirectory] = useState(false);

    const [submitAddUserToProject, { isLoading: isLoadingAddUsersToProject }] = useAddUserToProjectMutation();

    const handleModalCancel = () => {
        // Close modal, and clear self.
        setIsAddUserModalVisible(false);
        setSelectedUsers([]);
    };
    const handleModalOk = () => {
        // First validate the users that were selected, make sure each user has a role if not then return early
        const roleValidationCheck = selectedUsers.every(
            user => user.hasOwnProperty('role') && user.role && user.role !== ''
        );

        // If we do not pass the validation check, send the toast message to the user and exit
        // early (without closing the modal)
        if (!roleValidationCheck) {
            openNotification({
                message: "Cannot Invite Users without a Role",
                description: `You must select a role for all users that you are inviting to the Engage Platform.`,
                placement: 'topRight',
                icon: (<ExclamationCircleOutlined style={{ color: 'red' }} />),
            });
            return;
        }
        // Close modal, send callback for selected users, and clear self
        setIsAddUserModalVisible(false);
        if (onUsersSelected) onUsersSelected(selectedUsers);
        submitAddUserToProject({
            users: selectedUsers.map(user => ({ ...user, user_id: user.id })),
            projectID,
        }).then(({ data, error }) => {
            if (error) {
                renderFormErrors(error, null, "Error Adding User(s)");
            } else if (data) {
                openNotification({
                    message: "Added Users",
                    description: `You have added the users to the project`,
                    placement: 'topRight',
                    icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                });
            }
        }).catch(console.error);
        setSelectedUsers([]);
    };
    const handleModalUseDirectory = () => {
        setUseDirectory(true);
    };
    const directoryOnUsersSelected = (users) => {
        setSelectedUsers(users);
        setUseDirectory(false);
    };
    const directoryOnCancel = () => {
        setUseDirectory(false);
    };

    // I have no idea how this works, but it's for forcing the UserSearchBox component to re-render
    // when the modal is closed, so it can clear itself
    function onChangeModal() {
        const [clearValue, setClearValue] = useState(false);
        return () => setClearValue(!value);
    }

    const modalButtonActions = [
        <Button key="directory" onClick={handleModalUseDirectory}>Use Directory</Button>,
        <Button key="back" onClick={handleModalCancel}>Cancel</Button>,
        <Button key="submit" type="primary" onClick={handleModalOk}>Submit</Button>,
    ];

    const modalTitleNode = (<Title style={userPickerModalStyles.title}>{modalTitle}</Title>);

    // callback function to handle when a new user (invited to the platform) has their role changed
    const handleChangeInvitedUserRole = useCallback((value, userID) => {
        setSelectedUsers(previousSelectedUsers => {
            // Check the index for the modified user
            const changedUserIndex = previousSelectedUsers.findIndex(user => user.id === userID);
            if (changedUserIndex > -1) {
                // update the array to change the role for the selected user and return to the state
                const updatedSelectedUsers = [...previousSelectedUsers];
                updatedSelectedUsers[changedUserIndex] = {
                    ...updatedSelectedUsers[changedUserIndex],
                    role: value // Update the 'role' attribute with the new value
                };
                return updatedSelectedUsers;
            }
            return previousSelectedUsers;
        });
    }, [setSelectedUsers]);

    return (
        <>
            {((useDirectory)
                    ? <UserDirectoryModal originalSelectedUsers={selectedUsers}
                        onUsersSelected={directoryOnUsersSelected} onCancel={directoryOnCancel}
                    />
                    : <Modal title={modalTitleNode} open={IsAddUserModalVisible} footer={modalButtonActions}
                        style={userPickerModalStyles.container} closable={false}
                    >
                        <p style={userPickerModalStyles.paragraph}>
                            Invite a new team member by typing in their name or email.
                        </p>
                        <UserSearchBox clearOnSelect={true} onUserSelected={addUserToList} onCloseValue={onChangeModal}
                            searchBoxStyle={userPickerModalStyles.searchBox}
                            excludeUsers={[...selectedUsers, ...excludeUsers]}
                        />

                        <div style={userPickerModalStyles.listContainer}>
                            <List
                                itemLayout="horizontal"
                                dataSource={selectedUsers}
                                locale={{ emptyText: <Empty description={'No team members selected'} /> }}
                                renderItem={(user) => (
                                    <List.Item
                                        key={user.username}
                                        actions={
                                            [<Link type="danger" onClick={() => removeUserFromList(user)}>remove</Link>]
                                        }>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    src={'data:;base64,' + user.profile_picture}
                                                    alt={"the profile picture of this user"}
                                                />
                                            }
                                            title={
                                                <>
                                                    <Text style={userPickerModalStyles.listTitle}>
                                                        {user.full_name}
                                                    </Text>
                                                    {/* If the user id is negative (a new user) add an input to select the role*/}
                                                    {(user.id < 0)
                                                        ? (
                                                            <>
                                                                <br />
                                                                <SelectEngageRoleInput
                                                                    handleOnChange={(value) => handleChangeInvitedUserRole(value, user.id)}
                                                                    disabled={false}
                                                                    inputLabel={"What is their role on Engage?"}
                                                                    inputStyle={{
                                                                        backgroundColor: '#F5F5F5',
                                                                        borderRadius: '5px',
                                                                        border: '1px solid #AFAFAF',
                                                                        width: '60%'
                                                                    }}
                                                                />
                                                            </>
                                                        )
                                                        : (
                                                            <>
                                                                &nbsp;
                                                                <Text type="secondary"
                                                                    style={userPickerModalStyles.listTitle}>
                                                                    {user.role}
                                                                </Text>
                                                            </>
                                                        )
                                                    }
                                                </>
                                            }
                                            description={(
                                                <>
                                                    {user.username}
                                                    <br />
                                                    {user.email}
                                                </>
                                            )}
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                    </Modal>
            )}
        </>
    );
}
