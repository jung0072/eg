import React, { useState, useEffect } from 'react';
import { Collapse, Button, Modal, Typography, List, Avatar } from "antd";
import Link from 'antd/lib/typography/Link.js';
import './user_picker.css';
import { createTitleFromText, EngageSpinner } from '../utils';
import {
    usePreviewUserListQuery,
    useLazySearchUserTypeQuery
} from '../../redux/services/userAPI';

const { Text } = Typography;

const userDirectoryStyles = {
    collapsable: {
        borderRadius: '8px'
    }
};

function UserDirectoryRolePreview({ role, users, selectedUsers, onClickShowMore, onSelectUser, onDeselectUser }) {
    return (
        <>
            <List
                itemLayout="horizontal"
                dataSource={users}
                renderItem={(user) => (
                    <List.Item
                        key={user.username}
                        actions={
                            [
                                (
                                    selectedUsers.some(u => u.id === user.id)
                                        ? <Link type="danger" onClick={() => onDeselectUser(user)}>Deselect</Link>
                                        : <Link type="primary" onClick={() => onSelectUser(user)}>Select</Link>
                                )
                            ]
                        }>
                        <List.Item.Meta
                            avatar={<Avatar src={<img alt={'profile picture of the user'}
                                                      src={'data:;base64,' + user.profile_picture}/>}/>}
                            title={
                                <>
                                    <Text style={{ display: 'inline-block' }}>{user.full_name}</Text>
                                </>
                            }
                            description={"Last active 2022-01-26"}
                        />
                    </List.Item>
                )}
            />
            <Link onClick={() => onClickShowMore(role)}>Show more</Link>
        </>
    );
}

export default function UserDirectoryModal({ originalSelectedUsers, onUsersSelected, onCancel }) {
    // User related stuff
    const [selectedUsers, setSelectedUsers] = useState(originalSelectedUsers);
    const addUserToList = (user) => {
        // Skip adding the user if they're already in the list
        if (selectedUsers.some(u => parseInt(u.id) === parseInt(user.id))) {
            return;
        }

        // Update the selected users state
        setSelectedUsers([...selectedUsers, user]);
    };
    const removeUserFromList = (user) => setSelectedUsers(selectedUsers.filter(x => x.id !== user.id));

    // Modal open / close stuff
    const handleModalCancel = () => {
        // Close modal, and clear self.
        setSelectedUsers([]);
        if (onCancel) onCancel();
    };
    const handleModalOk = () => {
        // Close modal, send callback for selected users, and clear self
        setSelectedUsers([]);
        if (onUsersSelected) onUsersSelected(selectedUsers);
    };

    const mapCollapsablePanels = (item, idx) => (
        <Collapse.Panel header={createTitleFromText(item.tag)} key={idx} style={userDirectoryStyles.collapsable}>
            <UserDirectoryRolePreview role={item.tag} users={item.users}
                                      selectedUsers={selectedUsers} onClickShowMore={showMoreOf}
                                      onSelectUser={addUserToList} onDeselectUser={removeUserFromList}
            />
        </Collapse.Panel>
    );


    // State handling
    const [directoryUsers, setDirectoryUsers] = useState([]);
    const { data: previewUsers, isLoading: isLoadingPreviewUsers } = usePreviewUserListQuery();
    const [triggerUserSearch, _] = useLazySearchUserTypeQuery();
    const [showingMore, setShowingMore] = useState(null);
    const showMoreOf = (userRole) => {
        setShowingMore(userRole);
        triggerUserSearch(`?role=${userRole}`).then(({ data }) => setDirectoryUsers(data.users));
    };

    if (isLoadingPreviewUsers) {
        return (<EngageSpinner/>);
    }

    const panelList = [
        {
            tag: 'RESEARCHER',
            users: previewUsers.RESEARCHER
        },
        {
            tag: 'CLINICIAN',
            users: previewUsers.CLINICIAN
        },
        {
            tag: 'PATIENT',
            users: previewUsers.PATIENT
        },
        {
            tag: 'FAMILY_OF_PATIENT',
            users: previewUsers.FAMILY_OF_PATIENT
        }
    ];
    // TODO: Get a Last Active Date from the backend by updating the user query*
    return (
        <Modal title="User Directory" open={true} onOk={handleModalOk} onCancel={handleModalCancel}>
            {showingMore ?
                <>
                    <Text>Directory of {createTitleFromText(showingMore)}</Text>
                    <Link onClick={() => setShowingMore(null)}> &lt; Back</Link>
                    <List
                        itemLayout="horizontal"
                        dataSource={directoryUsers}
                        renderItem={(user) => (
                            <List.Item
                                key={user.username}
                                actions={
                                    [
                                        (
                                            selectedUsers.some(u => parseInt(u.id) === parseInt(user.id))
                                                ? (
                                                    <Link type="danger" onClick={() => removeUserFromList(user)}>
                                                        Deselect
                                                    </Link>
                                                )
                                                : (
                                                    <Link type="primary" onClick={() => addUserToList(user)}>
                                                        Select
                                                    </Link>
                                                )
                                        )
                                    ]
                                }>
                                <List.Item.Meta
                                    avatar={<Avatar src={<img src={'data:;base64,' + user.profile_picture}/>}/>}
                                    title={
                                        <>
                                            <Text style={{ display: 'inline-block' }}>{user.full_name}</Text>
                                        </>
                                    }
                                    description={`Last active ${new Date().toLocaleDateString()}`}
                                />
                            </List.Item>
                        )}
                    />
                </>
                : <Collapse accordion>
                    {panelList.map(mapCollapsablePanels)}
                </Collapse>
            }
        </Modal>
    );
}
