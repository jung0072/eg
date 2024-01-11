import React, { useState } from 'react';
import { Button, } from "antd";
import './user_picker.css';
import UserPickerModal from './UserPickerModal';

export default function InviteUsers({userId}) {

    const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false)

    const showModal = () => setIsAddUserModalVisible(true);

    return (
        <>
            <Button type="primary" onClick={showModal}>
                Invite users
            </Button>
            <UserPickerModal setIsAddUserModalVisible={setIsAddUserModalVisible} IsAddUserModalVisible={isAddUserModalVisible} excludeUsers={[{ id: userId }]}/>
        </>
    );
}
