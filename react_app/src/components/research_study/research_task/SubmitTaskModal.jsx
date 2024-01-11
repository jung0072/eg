import React, { useCallback, useEffect, useState } from 'react';
import { Button, Checkbox, Form, Input, Modal, Row, Typography, Upload } from "antd";
import { useSubmitTaskMutation } from "../../../redux/services/researchTaskAPI";
import { openNotification, renderFormErrors } from "../../utils";
import { CheckCircleOutlined } from "@ant-design/icons";
import './research_task_form.css';

const { Item } = Form;
const { TextArea } = Input;

export default function SubmitTaskModal(
    {
        isTaskModalOpen,
        setTaskModalOpen,
        projectID,
        researchTaskData,
        assignedUserTaskData
    }
) {
    const [formHook] = Form.useForm();
    const [submitResearchTask, { isLoading: isLoadingSubmitResearchTask }] = useSubmitTaskMutation();

    // callback to submit the modal on form success and then either show errors from the request or display the success
    const handleSubmitForm = useCallback((values) => {
        submitResearchTask({
            ...values,
            projectID,
            taskID: researchTaskData.task.task_id
        }).then(({ error, data }) => {
            if (error) {
                renderFormErrors(error, null, "Error Submitting Research Task");
            } else if (data.success) {
                setTaskModalOpen(false);
                openNotification({
                    placement: 'topRight',
                    message: 'Submitted Research Task',
                    description: `${data.success}`,
                    icon: <CheckCircleOutlined style={{ color: 'green' }}/>
                });  
            }
        }).catch(console.error);
    }, [setTaskModalOpen, submitResearchTask, researchTaskData, projectID]);

    // callback to close the modal
    const handleCancelModal = useCallback(() => {
        setTaskModalOpen(false);
    }, [setTaskModalOpen]);

    // useEffect hook to set the assigned user data to the form if it exists
    useEffect(() => {
        if (assignedUserTaskData) {
            formHook.setFieldsValue({ ...assignedUserTaskData });
        }
    }, [formHook, assignedUserTaskData]);

    return (
        <Modal centered={true} title={"Task Submission"} open={isTaskModalOpen} onCancel={handleCancelModal}
               footer={null} className={'research-form-node'}
        >
            <Form form={formHook} onFinish={handleSubmitForm} colon={false}>
                <Row>
                    <Item name="comments" label={'Comments'} labelCol={{ span: 24 }}
                          wrapperCol={{ span: 24 }}
                          rules={[{ required: false, message: 'Title field is required' }]}
                    >
                        <TextArea
                            type={'text'}
                            rows={4}
                            style={{ resize: 'none' }}
                        />
                    </Item>
                </Row>
                <Row style={{ justifyContent: 'center', marginBottom: '3em' }}>
                    <Item wrapperCol={{ span: 24 }} name={"is_complete"} valuePropName={"checked"}>
                        <Checkbox style={{ fontStyle: 'italic' }}>
                            Would you like to mark this task as complete?
                        </Checkbox>
                    </Item>
                </Row>
                <Row justify={'center'} align={'center'}>
                    <Button type="primary" htmlType="submit" style={{ width: '250px', height: '50px' }}
                            loading={isLoadingSubmitResearchTask}
                    >
                        Submit
                    </Button>
                </Row>
            </Form>
        </Modal>
    );
}
