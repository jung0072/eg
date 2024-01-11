import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircleFilled, CheckCircleOutlined, InfoCircleFilled } from '@ant-design/icons';
import { Button, Checkbox, Col, Form, Input, Modal, Row, Select } from 'antd';
import './research_task_form.css';
import { Constants, renderFormErrors } from "../../utils/";
import { useAddResearchTaskMutation } from '../../../redux/services/researchProjectAPI';
import { NotificationTypes, openNotification } from '../../utils';
import { useNavigate } from "react-router-dom";
import { formatMomentDate } from "../../utils/common";
import ModalPopup from '../../utils/ModalPopup';
import { useDeleteResearchTaskMutation } from '../../../redux/services/researchTaskAPI';
import { HelpTextPopover } from "render-chan";
import { EngageRolePicker, EstimatedDates } from '../../utils/engage_form_items/EngageFormItems';

const { TextArea } = Input;

export default function ResearchTaskFormModal(
    {
        project_id, modalVisible, setModalVisible, isCreating = true, teamMembers, researchTaskData = null
    }
) {
    const navigate = useNavigate();
    const [teamOptions, setTeamOptions] = useState(teamMembers);
    // set the Select All members Option
    const [allMembersOption, setAllMembersOption] = useState(false);
    // const [imageURL, setImageURL] = useState(null);
    // const [imageFileList, setImageFileList] = useState([]);
    // state variable to control disabling of 'Assign all members from the project'
    const [disabled, setDisabled] = useState(false);
    // state for selected members
    const [selectedMembers, setSelectedMembers] = useState([]);
    // mutation hook to submit the research task form
    const [addResearchTask, { isLoading: isLoadingSubmitResearchTask }] = useAddResearchTaskMutation();
    const [deleteResearchTask] = useDeleteResearchTaskMutation();
    // state variable to control rendering of Chat Room container
    const [formShow, setFormShow] = useState(false);
    const [deleteTaskModal, setDeleteTaskModal] = useState(false);
    const [hasPermissionToDelete, setHasPermissionToDelete] = useState(false);
    // form to allow methods of useForm
    const [formHook] = Form.useForm();

    // if the user is editing the form or creating the form show the proper label
    const modalTitle = (isCreating) ? 'New Task' : 'Edit Task';

    // est end date(s) for the task
    const {
        due_date_type,
        due_date,
        is_using_due_date,
        roles_needed,
    } = researchTaskData?.task || {};
    const momentDueDate = formatMomentDate(due_date);

    // useEffect block to set the initial formValues each time the researchProjectData coming into the form changes
    useEffect(() => {
        if (researchTaskData) {
            formHook.setFieldsValue({
                ...researchTaskData.task,
                ...researchTaskData,
                title: researchTaskData.task.title,
                description: researchTaskData.task.description,
                roles_needed: researchTaskData.roles_required,
                user_ids: researchTaskData.members.map(member => member.id),
                subject: researchTaskData.task.subject,
                hide_submitted_files: researchTaskData.task.hide_submitted_files,
            });
            // set the members
            setSelectedMembers(researchTaskData.members.map(member => member.id));
            // check if the user has permission to delete the task, checks: 
            // if user is editing and if user has any of the following permissions (task_owner, isPI, isProjectLead)
            const isPermitted = !isCreating && (
                researchTaskData?.is_task_owner
                || researchTaskData?.user_permissions?.is_principal_investigator
                || researchTaskData?.user_permissions?.is_project_lead
            )
            setHasPermissionToDelete(isPermitted);
        }
    }, [formHook, researchTaskData]);

    // function to control rendering of Chat Room container
    // show the container if 'Create a Task specific discussion board' checkbox is checked, else don't
    const onForm = useCallback((e) => {
        setFormShow(e.target.checked);
    }, [setFormShow]);

    const handleCloseModal = useCallback(() => {
        if (isCreating) {
            formHook.resetFields();
            setFormShow(false);
            setDisabled(false);
        }
        setModalVisible(false);
    }, [setFormShow, setDisabled, setModalVisible]);

    // hook to delete the task
    const handleDeleteTaskCallback = useCallback((taskData) => {
        deleteResearchTask(taskData).then((apiResponse) => {
            const { success, error } = apiResponse.data;
            if (error) {
                renderFormErrors({ data: { error } });
            } else if (success) {
                // show the user a notification saying the task was deleted
                openNotification({
                    placement: 'topRight',
                    message: `Successfully Deleted Task ${taskData.taskID}`,
                    description: `${success}`,
                    icon: <CheckCircleOutlined style={{ color: 'green' }} />
                });
                setDeleteTaskModal(false);
                navigate(-1, { replace: true });
            }
        });
    }, []);

    // callback function to handle the form submit
    // close modal, log values, reset fields, close Chat Room container, remove uploaded files
    const handleFormSubmit = useCallback((values) => {
        if (values.is_using_due_date) {
            values.end_date = formatMomentDate(values.due_date).format("YYYY-MM-DD");
        }
        values.user_ids = selectedMembers;
        addResearchTask({ projectID: project_id, taskFormData: values, taskID: researchTaskData?.task?.task_id }).then(
            ({ data, error }) => {
                if (data) {
                    openNotification({
                        placement: 'topRight',
                        message: (isCreating) ? "Task Created" : 'Task Edited',
                        description: `${data.success.success}${(isCreating) ? 'We will now navigate you to the research task page.' : ''}`,
                        icon: (<CheckCircleFilled style={{ color: 'green' }} />),
                        type: NotificationTypes.SUCCESS,
                        callback: () => isCreating ? navigate(`/app/research_task/${data.success.resource_id}/`) : navigate(0),
                        timeout: isCreating ? 5000 : 1000
                    });
                } else if (error) {
                    renderFormErrors(
                        error, null,
                        `There was an error ${(isCreating) ? 'creating' : 'editing'} the task`
                    );
                }
            }
        ).catch((err) => openNotification({
            placement: 'topRight',
            message: `There was an error ${(isCreating) ? 'creating' : 'editing'} the task`,
            description: err,
            icon: (<InfoCircleFilled style={{ color: 'red' }} />),
            type: NotificationTypes.ERROR
        }));

        // resetFormFields if we in the task creation form
        if (isCreating) {
            formHook.resetFields();
            setDisabled(false);
        }
        setFormShow(false);
        setModalVisible(false);
    }, [formHook, setFormShow, setDisabled, setModalVisible, selectedMembers]);

    const onRoleChange = useCallback((checkedItem) => {
        // set active member
        let resultTeamMemberArray;
        if (checkedItem.length === 0) {
            // return all fields from project member
            resultTeamMemberArray = teamMembers;
            setTeamOptions(resultTeamMemberArray);
        } else {
            // filter project member by role
            resultTeamMemberArray = teamMembers.filter((item) => checkedItem.includes(item.role));
            setTeamOptions(resultTeamMemberArray);
        }
    }, [setTeamOptions]);

    const handleAssignAllTeamMembers = (e) => {
        if (e.target.checked) {
            // set all team members
            setSelectedMembers(teamMembers.map(user => user.value));
            setAllMembersOption(true);
        } else {
            formHook.setFieldValue({ user_ids: selectedMembers });
            setAllMembersOption(false);
        }
    }

    const handleSelectedTeamMember = (value) => {
        setSelectedMembers(value);
    }

    return (
        <div className={'research-task-form'}>
            <Modal centered={true} title={modalTitle} open={modalVisible} onCancel={handleCloseModal} footer={null}>
                <Form form={formHook} name="researchTaskForm" onFinish={handleFormSubmit} colon={false}
                    className={'research-form-node'}>
                    <Row style={{ justifyContent: 'center' }}>
                        <Col span={24}>
                            <Form.Item name="title" label={'Title of the task'} labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true, message: 'Title field is required' }]}>
                                <Input type={'text'} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row style={{ justifyContent: 'center' }}>
                        <Col span={24}>
                            <Form.Item name="description" label={'Task Description'} labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true, message: 'Description field is required' }]}>
                                <TextArea
                                    type={'text'}
                                    rows={4}
                                    style={{ resize: 'none' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row style={{ justifyContent: 'center' }}>
                        <Col span={24}>
                            <Form.Item name="subject" label={'Task Subject'} labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true, message: 'Subject field is required' }]}>
                                <TextArea
                                    type={'text'}
                                    rows={2}
                                    style={{ resize: 'none' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        {/* The row for the due dates */}
                        <EstimatedDates
                            compKey={"due"}
                            dateType={'Due'} // start or due
                            initialDateDecided={is_using_due_date}
                            initialItemDateType={Constants.DATE_TYPES[due_date_type]} // initial date type which will be set by the state
                            initialDate={momentDueDate}
                            dateOptions={[Constants.DATE_TYPES.DAY_MONTH, Constants.DATE_TYPES.MONTH_YEAR, Constants.DATE_TYPES.EXACT_DATE]}
                        />
                    </Row>
                    <Row style={{ justifyContent: 'center' }}>
                        <Col span={24}>
                            <Form.Item
                                name="hide_submitted_files"
                                label={<HelpTextPopover questionText={"Would you like to hide submitted files?"}
                                    helpText={"Hiding submitted files means that only project owners and PIs can view files posted by users for this task"}
                                />}
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <Checkbox
                                    style={{ fontStyle: 'italic' }}
                                    defaultChecked={formHook.getFieldValue('hide_submitted_files')}
                                    onChange={(evt) => formHook.setFieldValue('hide_submitted_files', evt.target.checked)}
                                >
                                    Hide Submitted Files
                                </Checkbox>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row style={{ justifyContent: 'center' }}>
                        <Col span={24}>
                            <EngageRolePicker
                                initialSelectedRole={roles_needed}
                                questionLabel={"Roles required for this task"}
                                required={false}
                                onRoleChangeCallback={onRoleChange}
                            />
                        </Col>
                    </Row>
                    <Row style={{ justifyContent: 'center' }}>
                        <Col span={24}>
                            <Form.Item wrapperCol={{ span: 24 }}>
                                <Checkbox
                                    disabled={disabled}
                                    style={{ fontStyle: 'italic' }}
                                    onChange={(e) => handleAssignAllTeamMembers(e)}
                                >
                                    Assign all the members from the project
                                </Checkbox>
                            </Form.Item>
                        </Col>
                    </Row>
                    {!allMembersOption && (
                        <Row style={{ justifyContent: 'center' }}>
                            <Col span={24}>
                                <Row style={{ justifyContent: 'center' }}>
                                    <Form.Item
                                        label={"Assign specific team members to task"}
                                        name="user_ids" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                    >
                                        <Select mode="multiple" options={teamOptions} onChange={handleSelectedTeamMember} />
                                    </Form.Item>
                                </Row>
                            </Col>
                        </Row>
                    )}
                    <div id="action-button-container" style={projectManagementStyles.buttonStyling}>
                        {hasPermissionToDelete ?
                            <Button onClick={() => setDeleteTaskModal(true)} type="primary">
                                Delete Task
                            </Button> : null
                        }
                        <Form.Item style={projectManagementStyles.adjustSubmitButtonWidth}>
                            <Button id="submitButton" type="primary" htmlType="submit">
                                {(isCreating) ? 'Create Task' : 'Update'}
                            </Button>
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
            {deleteTaskModal ?
                <ModalPopup
                    title="Delete Task"
                    visible={deleteTaskModal}
                    handleOk={() => handleDeleteTaskCallback({
                        projectID: project_id,
                        taskID: researchTaskData?.task?.task_id
                    })}
                    handleCancel={() => setDeleteTaskModal(false)}
                    type="info"
                    disableScreenTouch={true}
                    footerButton="Delete Task"
                    centered={true}
                    width={650}
                >
                    <Row align={'center'}>
                        <h1 style={projectManagementStyles.warningTitle}>Warning!</h1>
                        <h2 style={projectManagementStyles.userDeleteTitle}>
                            Deleting a task means, all their data will be deleted including discussion boards and
                            messages.
                            Please confirm the task detail first.
                        </h2>
                    </Row>
                    <Row>
                        <Col span={12}><span style={projectManagementStyles.fieldName}>Task Title: </span> <span
                            style={projectManagementStyles.fieldValue}>{researchTaskData?.task.title}</span>
                        </Col>
                        <Col span={12}><span style={projectManagementStyles.fieldName}>Creator: </span> <span
                            style={projectManagementStyles.fieldValue}>{researchTaskData?.task_creator}</span>
                        </Col>
                        <Col span={12}><span style={projectManagementStyles.fieldName}>Project Title: </span> <span
                            style={projectManagementStyles.fieldValue}>{researchTaskData?.task.research_project_title}</span>
                        </Col>
                    </Row>
                </ModalPopup> : null}
        </div>
    );
}

const projectManagementStyles = {
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
    },
    adjustSubmitButtonWidth: {
        marginBottom: 0,
        width: 'auto',
    },
    buttonStyling: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    }
};
