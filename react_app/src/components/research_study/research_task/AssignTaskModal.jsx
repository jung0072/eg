import React, { useCallback } from "react";
import { Modal, Form, Typography, Row, Button, Select } from "antd";
import UserSearchBox from "../../user_picker/UserSearchBox";
import './research_task_form.css';
import { useAssignTaskMutation } from "../../../redux/services/researchTaskAPI";
import { openNotification, renderFormErrors } from "../../utils";
import { CheckCircleOutlined } from "@ant-design/icons";


const { Item } = Form;

export default function AssignTaskModal(
    {
        isAssignTaskModalOpen,
        setAssignTaskModalOpen,
        researchTaskData,
        projectID,
        teamMembers,
    }
) {
    const [formHook] = Form.useForm();
    const [submitAssignTaskForm, { isLoading: isLoadingAssignTask }] = useAssignTaskMutation();
    const handleCancelModal = useCallback(() => setAssignTaskModalOpen(false), [setAssignTaskModalOpen]);
    const handleFormFinish = useCallback((values) => {
        submitAssignTaskForm({
            ...values,
            projectID,
            taskID: researchTaskData.task.task_id,
            method: 'POST'
        }).then(
            ({ error, data }) => {
                if (error) {
                    renderFormErrors(error, null, "Error Assigning Member to Research Task");
                } else if (data.success) {
                    setAssignTaskModalOpen(false);
                    openNotification({
                        placement: 'topRight',
                        message: 'Assigned Research Task',
                        description: `${data.success}`,
                        icon: <CheckCircleOutlined style={{ color: 'green' }} />
                    });
                    formHook.resetFields();
                }
            });
    }, [submitAssignTaskForm, setAssignTaskModalOpen]);

    return (
        <Modal centered={true} title={"Assign a Team Member"} open={isAssignTaskModalOpen} onCancel={handleCancelModal}
            footer={null} className={'research-form-node'}
        >
            <Form onFinish={handleFormFinish} form={formHook} scrollToFirstError={true}>
                <Row>
                    <Form.Item
                        label={"Search for a team member to assign to this task"}
                        name="assigned_user" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                    >
                        <Select options={teamMembers} />
                    </Form.Item>
                </Row>
                <Row>
                    <Button type="primary" htmlType={'submit'} loading={isLoadingAssignTask}>
                        Assign User
                    </Button>
                </Row>
            </Form>
        </Modal>
    );
}
