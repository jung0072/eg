import React, { useCallback, useEffect, useState } from 'react';
import { Button, Checkbox, Form, Input, Modal, Row, Typography, Upload } from "antd";
import { useFinalizeTaskMutation } from "../../../redux/services/researchTaskAPI";
import { openNotification, renderFormErrors } from "../../utils";
import { CheckCircleOutlined } from "@ant-design/icons";
import './research_task_form.css';


export default function FinalizeTaskModal(
    {
        isTaskModalOpen,
        setTaskModalOpen,
        projectID,
        researchTaskData,
        assignedUserTaskData
    }
) {
    const [formHook] = Form.useForm();
    const [finalizeResearchTask, { isLoading: isLoadingFinalizeResearchTask }] = useFinalizeTaskMutation();

    // callback to finalize the modal on form success and then either show errors from the request or display the success
    const handleFinalizeForm = useCallback(() => {
        finalizeResearchTask({
            projectID,
            taskID: researchTaskData.task.task_id
        }).then(({ error, data }) => {
            if (error) {
                renderFormErrors(error, null, "Error Finalizeting Research Task");
            } else if (data.success) {
                setTaskModalOpen(false);
                openNotification({
                    placement: 'topRight',
                    message: 'Finalizeted Research Task',
                    description: `${data.success}`,
                    icon: <CheckCircleOutlined style={{ color: 'green' }}/>
                });  
            }
        }).catch(console.error);
    }, [setTaskModalOpen, finalizeResearchTask, researchTaskData, projectID]);

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
        <Modal centered={true} title={"Task Finalization"} open={isTaskModalOpen} onCancel={handleCancelModal}
               footer={null} className={'research-form-node'}
        >
            <Form form={formHook} onFinish={handleFinalizeForm} colon={false}>
                <Row justify={'center'} align={'center'}>
                    <Button type="primary" htmlType="submit" style={{ width: '250px', height: '50px' }}
                            loading={isLoadingFinalizeResearchTask}
                    >
                        Finalize
                    </Button>
                </Row>
            </Form>
        </Modal>
    );
}
