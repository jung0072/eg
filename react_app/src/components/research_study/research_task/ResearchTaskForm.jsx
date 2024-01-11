import React, {useCallback, useState} from 'react';
import {PlusOutlined} from '@ant-design/icons';
import {Button, Modal, Row, Col, Form, Input, Checkbox, Select, DatePicker, Upload, message} from 'antd';
import './research_task_form.css';
import ResearchTaskFormModal from "./ResearchTaskFormModal.jsx";

export default function ResearchTaskForm({isCreating = true}) {

    // state variable to control the modal display
    const [isModalOpen, setIsModalOpen] = useState(false);
    // if the user is editing the form or creating the form show the proper label
    const buttonLabel = (isCreating)
        ? 'Create Research Task'
        : 'Edit Research Task';

    // callback functions to handle modal driven events of open
    const handleShowModal = useCallback(() => setIsModalOpen(true), []);

    // render
    return (
        <div>
            <Button type={'primary'} onClick={handleShowModal}>
                {buttonLabel}
            </Button>
            <ResearchTaskFormModal setModalVisible={setIsModalOpen} modalVisible={isModalOpen} isCreating={true} />
        </div>
    );
}
