import { faCalendar, faCheckCircle, faClipboard, faUser, } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Col, Collapse, Form, Popover, Row, Select, Space, Table, Tooltip, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import ProjectCalendar from '../../project_calendar/ProjectCalendar';
import ProjectDetailsVisitorView, {
    makeHiddenStyles,
    makeVisibleStyles,
} from '../projectDetailsVisitorView/ProjectDetailsVisitorView.jsx';
import './projectDetailsMemberView.css';
import { Constants, openNotification, renderFormErrors } from "../../../utils/";
import { JoinProjectButton } from "../JoinProjectButton";
import {
    useDeactivateMemberFromProjectMutation,
    useDeactivateSelfFromProjectMutation,
    useDeleteMemberFromProjectMutation,
    useLazyActivateUserParticipationQuery,
    useModifyUserParticipationMutation,
    usePromptUserToJoinProjectMutation
} from '../../../../redux/services/researchProjectAPI';
import ResearchTaskFormModal from '../../research_task/ResearchTaskFormModal';
import UserPickerModal from '../../../user_picker/UserPickerModal';
import {
    CheckCircleOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    FileAddOutlined,
    MailOutlined,
    TeamOutlined
} from '@ant-design/icons';
import ModalPopup from '../../../utils/ModalPopup';
import { Link, useParams } from 'react-router-dom';
import { getEstimatedDates, getNumberOfDaysBetweenDates } from "../../../utils/common";
import { DANGER } from '../../../utils/colors.jsx';
import { projectArchiveDisableActionString } from '../../../utils/constants.strings.js';

const { Text, Title } = Typography;
const { Panel: CollapsablePanel } = Collapse;
const { HumanizedUserRoles, USER_PROFILE_ROUTE } = Constants;
const TASK_BTN_ID = 'task-btn';
const CALENDAR_BTN_ID = 'calendar-btn';
const TEAM_BTN_ID = 'team-btn';

const teamTableColumns = [
    {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        sorter: (a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1),
        defaultSortOrder: 'ascend',
        sortDirections: ['ascend', 'descend'],
        render: (name, record) => (name && name !== '') ? (
            <Link to={`${USER_PROFILE_ROUTE}${record?.userId}/`}>{name}</Link>
        ) : (
            <>{record.email}</>
        )
    },
    {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        sorter: (a, b) => (a.role.toLowerCase() < b.role.toLowerCase() ? -1 : 1),
        sortDirections: ['ascend', 'descend'],
    },
    {
        title: 'Permissions',
        dataIndex: 'permission_level',
        key: 'permission_level',
    },
    {
        title: 'Status',
        dataIndex: 'stage',
        key: 'stage',
    },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        align: 'left'
    },
];


export default function ({ researchProjectData, activeMembers, currentUser }) {
    const [currentView, setCurrentView] = useState(TASK_BTN_ID);
    const [taskBlockStyles, setTaskBlockStyles] = useState(makeHiddenStyles);
    const [calendarBlockStyles, setCalendarBlockStyles] = useState(makeHiddenStyles);
    const [teamBlockStyles, setTeamBlockStyles] = useState(makeHiddenStyles);
    const [triggerRequestToActivateMemberData, { isLoading }] = useLazyActivateUserParticipationQuery();
    const [triggerModifyUserPermissions, { isLoading: isLoadingModifyUserPermissions }] = useModifyUserParticipationMutation();
    const [triggerPromptUserToJoinProject, { isLoading: isLoadingPromptRequest }] = usePromptUserToJoinProjectMutation();
    const [createTaskModal, setCreateTaskModal] = useState(false); //state for create a new task modal
    const [addTeamMemModal, setAddTeamMemModal] = useState(false); // state for add team member modal
    const [canEditPermission, setCanEditPermissions] = useState(false);
    const [joinProjectBtn, setJoinProjectBtn] = useState(null);
    const { user_permissions: userPermissions = null } = researchProjectData;
    const researcherRoles = ["Researcher", "Clinician"];
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // state for delete project modal
    const [isDeactivateModalVisible, setIsDeactivateMemberModalVisible] = useState(false); // state for deactivate project modal
    const [isDeactivateSelfModalVisible, setIsDeactivateSelfModalVisible] = useState(false); // state for deactivate project modal
    const { id: project_id } = useParams();
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [displayedStudyTeam, setDisplayedStudyTeam] = useState([]);

    const handleBtnClick = useCallback((event) => {
        const { id } = event.currentTarget;
        setCurrentView(id);
    }, []);

    const handleCreateTask = useCallback(() => {
        setCreateTaskModal(true);
    });
    const handleAddTeamMember = useCallback(() => {
        setAddTeamMemModal(true);
    });
    useEffect(() => {
        setTaskBlockStyles(currentView === TASK_BTN_ID ? makeVisibleStyles : makeHiddenStyles);
        setCalendarBlockStyles(currentView === CALENDAR_BTN_ID ? makeVisibleStyles : makeHiddenStyles);
        setTeamBlockStyles(currentView === TEAM_BTN_ID ? makeVisibleStyles : makeHiddenStyles);
    }, [currentView, makeVisibleStyles, makeHiddenStyles, TASK_BTN_ID, CALENDAR_BTN_ID, TEAM_BTN_ID]);

    // useEffect hook to set the study team into a state variable which can be modified
    useEffect(() => {
        if (researchProjectData.study_team) {
            setDisplayedStudyTeam(researchProjectData.study_team);
        }
    }, [researchProjectData]);


    // Use Effect hook to check if the current user can edit user permissions on the project (LEAD or ADMIN)
    useEffect(() => {
        // first check if we have a current user
        if (currentUser && displayedStudyTeam) {
            // first filter out all the non-admins and project leads
            const leadUsers = (displayedStudyTeam.length > 0)
                ? displayedStudyTeam.filter(member => member.permission_level === "ADMIN" || member.permission_level === "LEAD")
                : [];
            setCanEditPermissions(leadUsers.map(({ user_id }) => user_id).includes(currentUser.user.id));
        }
    }, [currentUser, researchProjectData, setCanEditPermissions, displayedStudyTeam]);

    // Use Effect hook to create the join project button based on the current user permissions. this button does not
    // show if the user is on the project
    useEffect(() => {
        // Check if the user is even allowed to join a project, if they are a researcher they must be approved
        const isUserAnonymous = currentUser.user.is_anonymous;
        if (currentUser) {
            if (researcherRoles.includes(currentUser.user.role) && !currentUser.user.is_researcher) {
                setJoinProjectBtn(null);
            } else {
                // TODO: Make sure this is showing properly as per client request
                setJoinProjectBtn((userPermissions && userPermissions !== '')
                    ? (!userPermissions.is_active)
                        ? (userPermissions.is_approved)
                            ? (
                                <JoinProjectButton researchProjectData={researchProjectData}
                                    userID={userPermissions.user_id} acceptInvite={true}
                                />
                            )
                            : (
                                <strong>
                                    [Pending project owner approval to join this
                                    project: {researchProjectData.reference_name}]
                                </strong>
                            )
                        : null
                    : (
                        <JoinProjectButton researchProjectData={researchProjectData}
                            isAnon={isUserAnonymous}
                            userID={userPermissions.user_id}
                        />
                    ));
            }
        } else {
            setJoinProjectBtn(null);
        }

    }, [userPermissions, currentUser]);

    // hook to handle the callback from the delete project modal
    const [deleteMemberFromProject] = useDeleteMemberFromProjectMutation();
    const handleDeleteMemberCallback = useCallback(() => {
        deleteMemberFromProject({ projectId: project_id, userId: selectedUserId })
            .then((apiResponse) => {
                const { success, error } = apiResponse.data;
                if (error) {
                    renderFormErrors({ data: { error } });
                } else if (success) {
                    openNotification({
                        placement: 'topRight',
                        message: `Successfully Deleted Member ${selectedUserId}`,
                        description: `${success}`,
                        icon: <CheckCircleOutlined style={{ color: 'green' }} />
                    });
                    window.location.reload();
                }
            }).catch((error) => {
                renderFormErrors({ data: { error } });
            });
    }, [selectedUserId]);

    // hook to handle the callback from the deactivate member modal
    const [deactivateMemberFromProject] = useDeactivateMemberFromProjectMutation();
    const handleDeactivateMemberCallback = useCallback(() => {
        deactivateMemberFromProject({ projectId: project_id, userId: selectedUserId })
            .then(({ data, error }) => {
                if (error) {
                    openNotification({
                        placement: 'topRight',
                        message: `Error Deactivated Member ${selectedUserId}`,
                        description: `${error.data?.error ?? error.data?.detail}`,
                        icon: <ExclamationCircleOutlined style={{ color: 'red' }} />
                    });
                } else if (data) {
                    openNotification({
                        placement: 'topRight',
                        message: `Successfully Deactivated Member ${selectedUserId}`,
                        description: `${data.success}`,
                        icon: <CheckCircleOutlined style={{ color: 'green' }} />
                    });
                    window.location.reload();
                }
            }).catch((error) => {
                renderFormErrors({ data: { error } });
            });
    }, [selectedUserId]);

    // hook to handle the callback from the deactivate self modal
    const [deactivateSelfFromProject] = useDeactivateSelfFromProjectMutation();
    const handleDeactivateSelfCallback = useCallback(() => {
        deactivateSelfFromProject({ projectId: project_id })
            .then(({ data, error }) => {
                if (error) {
                    openNotification({
                        placement: 'topRight',
                        message: `Error Leaving Project`,
                        description: `${error.data?.error ?? error.data?.detail}`,
                        icon: <ExclamationCircleOutlined style={{ color: 'red' }} />
                    });
                } else if (data) {
                    openNotification({
                        placement: 'topRight',
                        message: `Successfully Left Project`,
                        description: `${data.success}`,
                        icon: <CheckCircleOutlined style={{ color: 'green' }} />
                    });
                    window.location.reload();
                }
            }).catch((error) => {
                renderFormErrors({ data: { error } });
            });
    }, []);

    const completedTasks = researchProjectData.tasks.filter(task => task.is_complete === true && new Date().getTime() - new Date(task.due_date).getTime() > 0);
    const currentTasks = researchProjectData.tasks.filter(task => new Date().getTime() - new Date(task.due_date).getTime() <= 0);
    const overdueTasks = researchProjectData.tasks.filter(task => task.is_complete === false && new Date().getTime() - new Date(task.due_date).getTime() > 0);

    // Render the tasks
    const RenderCollapsableTask = ({ taskData, showHeader = true, taskType }) => {
        return taskData.length > 0 ? (
            taskData.map((task, id) => {
                let taskDueDate = 'Not Set';
                const estDueDate = {
                    is_using_end_date: task.is_using_due_date,
                    end_date_type: task.due_date_type,
                    end_date: task.due_date,
                }
                if (task.is_using_due_date && task.due_date) {
                    taskDueDate = getEstimatedDates(estDueDate, true, "-").endDate
                }
                return (
                    <Collapse
                        className="mb-25"
                        bordered={false}
                        collapsible="icon"
                        ghost
                        accordion
                    >
                        <CollapsablePanel
                            key={id}
                            className="task-collapse"
                            header={showHeader && (
                                <Row justify="space-between">
                                    <Col span={8}>
                                        <Link to={`/app/research_task/${task.task_id}`} underline>
                                            {task.title}
                                        </Link>
                                    </Col>
                                    <Col span={6}>{task.task_creator}</Col>
                                    <Col span={6} style={taskType == "DUE" ? { color: DANGER } : {}}>
                                        {taskDueDate}
                                    </Col>
                                </Row>
                            )}
                        >
                            Subject: {task.description}
                            <br />
                        </CollapsablePanel>
                    </Collapse>
                )
            })
        ) : (
            <li>There are no tasks available</li>
        );
    }

    const displayedCompletedTasks = (completedTasks.length > 0)
        ? completedTasks.map(task => (
            <Row>
                <Col span={3}>
                    <li key={task.task_id}>
                        <Link to={`/app/research_task/${task.task_id}/`}>{task.title}</Link>
                    </li>
                </Col>
                <Col span={3}>
                    <FontAwesomeIcon
                        icon={faCheckCircle}
                        color={'#1AB759'}
                    />
                </Col>
            </Row>
        ))
        : (<li>There are no complete tasks available</li>);

    const membershipRequiredElements = (
        <>
            <Row justify="space-between" className="mb-25">
                <Button
                    id="task-btn"
                    className={`member-view-btn ${currentView === TASK_BTN_ID && 'active'}`}
                    size="large"
                    icon={<FontAwesomeIcon icon={faClipboard} />}
                    onClick={handleBtnClick}
                >
                    Task
                </Button>
                <Button
                    id="calendar-btn"
                    className={`member-view-btn ${currentView === CALENDAR_BTN_ID && 'active'}`}
                    size="large"
                    icon={<FontAwesomeIcon icon={faCalendar} />}
                    onClick={handleBtnClick}
                >
                    Calendar
                </Button>
                <Button
                    id="team-btn"
                    className={`member-view-btn ${currentView === TEAM_BTN_ID && 'active'}`}
                    size="large"
                    icon={<FontAwesomeIcon icon={faUser} />}
                    onClick={handleBtnClick}
                >
                    Team
                </Button>
            </Row>

            <div className="mb-25 collapsible" style={taskBlockStyles}>
                <Row justify="space-between">
                    <Col span={10}>
                        <Title level={5} className="attribute-title">
                            Overdue tasks
                        </Title>
                    </Col>
                    {currentTasks.length > 0 || overdueTasks.length > 0 ?
                        <>
                            <Col span={6}>
                                <Text>Creator</Text>
                            </Col>
                            <Col span={6}>
                                <Text>Deadline</Text>
                            </Col>
                        </> : ""
                    }
                </Row>

                {/* Overdue tasks section */}
                <RenderCollapsableTask taskData={overdueTasks} taskType={"DUE"} />

                {/* Current tasks section */}
                <div style={{ margin: '1rem 0' }}>
                    <Row justify="space-between">
                        <Col span={10}>
                            <Title level={5} className="attribute-title">
                                Current tasks
                            </Title>
                        </Col>
                    </Row>
                    <RenderCollapsableTask taskData={currentTasks} taskType={"CURRENT"} />
                </div>

                {/* Completed Tasks section */}
                <Title level={5} className="attribute-title">
                    Completed tasks
                </Title>
                <Text italic>
                    Note: These discussions are closed to comments as the tasks have been completed. Tasks can
                    be reopened by the project lead.
                </Text>

                <Collapse className="mt-20 mb-25" bordered={false} ghost>
                    <CollapsablePanel header="Completed task" className="task-collapse" key={"task-collapse"}>
                        List of completed tasks
                        <ul>
                            {displayedCompletedTasks}
                        </ul>
                    </CollapsablePanel>
                </Collapse>
                {createTaskModal ?
                    <ResearchTaskFormModal project_id={researchProjectData.id} setModalVisible={setCreateTaskModal}
                        modalVisible={createTaskModal}
                        isCreating={true} teamMembers={activeMembers}
                    /> : ""}
                <Row justify={'end'}>
                    <Tooltip title={researchProjectData.is_archived && projectArchiveDisableActionString}>
                        <span>
                            <Button disabled={researchProjectData.is_archived} className="create-new-task-button"
                                onClick={handleCreateTask}
                            >
                                <FileAddOutlined /> Create Task
                            </Button>
                        </span>
                    </Tooltip>
                </Row>
            </div>

            <div className="mb-25 collapsible" style={calendarBlockStyles}>
                <ProjectCalendar researchProjectData={researchProjectData} />
            </div>

            <div className="team-members-wrapper mb-25 collapsible" style={teamBlockStyles}>

                {/* if project is archived show that action buttons are disabled */}
                {researchProjectData.is_archived &&
                    <Row style={{ padding: '0.6rem 0' }}>
                        The project is archived; actions are unavailable.
                    </Row>
                }

                <Title level={5} className="attribute-title">
                    Team Members:
                </Title>
                <Table columns={teamTableColumns}
                    dataSource={displayedStudyTeam.map((
                        {
                            id,
                            full_name,
                            role,
                            is_active,
                            user_id,
                            permission_level,
                            email,
                            stage,
                            prompt_date,
                        }
                    ) => ({
                        key: id,
                        userId: user_id,
                        email,
                        name: full_name,
                        role: HumanizedUserRoles[role],
                        stage,
                        permission_level: (
                            <Form.Item label={''} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                style={{ marginBottom: 0 }}
                                name="permission_level"
                            >
                                <Select
                                    name="permission_level"
                                    onChange={(event) => {
                                        triggerModifyUserPermissions({
                                            userID: user_id,
                                            projectID: researchProjectData.id,
                                            permissionLevel: event
                                        }).then(({ data, error }) => {
                                            if (error) {
                                                openNotification({
                                                    placement: 'topRight',
                                                    message: 'Error Updated Team Member',
                                                    description: `${error.data?.error ?? error.data?.detail}`,
                                                    icon: <ExclamationCircleOutlined style={{ color: 'red' }} />
                                                });
                                            } else {
                                                openNotification({
                                                    placement: 'topRight',
                                                    message: 'Updated Team Member',
                                                    description: `${data.success}`,
                                                    icon: <CheckCircleOutlined style={{ color: 'green' }} />
                                                });
                                            }
                                        });
                                    }}
                                    defaultValue={(["REQUEST", "INVITE"].includes(permission_level)) ? 'BASE' : permission_level}
                                    disabled=
                                    {researchProjectData.is_archived || (
                                        !canEditPermission
                                        || user_id === currentUser.user.id
                                        || ["REQUEST", "INVITE"].includes(permission_level)
                                    )}
                                    options={[
                                        { value: "BASE", label: "Team Member" },
                                        { value: "ADMIN", label: "Principal Investigator" },
                                        { value: "LEAD", label: "Project Lead" },
                                    ]} />
                            </Form.Item>
                        ),
                        actions: (
                            <Space>
                                {/* Only show this button only if the following conditions are all met:
                                    1. The displayed user is not active and not INVITE
                                       (We are not showing this button for REQUEST users)
                                    2. The current user is a project lead
                                */}
                                {(!is_active && permission_level !== "INVITE") && userPermissions.is_project_lead ? (
                                    <Button type={'default'}
                                        disabled={researchProjectData.is_archived}
                                        onClick={(clickEvent) => {
                                            triggerRequestToActivateMemberData({
                                                projectID: researchProjectData.id,
                                                userID: user_id
                                            }).then(({ data, error }) => {
                                                if (error) {
                                                    renderFormErrors({ data: { error } });
                                                } else {
                                                    openNotification({
                                                        placement: 'topRight',
                                                        message: 'Added Team Member',
                                                        description: `${data.success}`,
                                                        icon: <CheckCircleOutlined style={{ color: 'green' }} />
                                                    });
                                                }
                                            }).catch(console.error);
                                        }}
                                    >
                                        Activate
                                    </Button>
                                ) : null}
                                {/*/ Only show this button only if the following conditions are all met:
                                    1. The displayed user is active
                                    2. The displayed user is not a project lead
                                    3. The displayed user is not an anonymous user
                                    4. The current user is EITHER a project lead OR the user being displayed
                                */}
                                {(is_active && (permission_level !== "LEAD") && !full_name.includes("ANONYMOUS") && (userPermissions.is_project_lead || (userPermissions.user_id === user_id))) ? (
                                    <Button
                                        disabled={researchProjectData.is_archived}
                                        type={'default'}
                                        icon={<ExclamationCircleOutlined />}
                                        onClick={() => {
                                            setSelectedUserId(user_id);
                                            if (userPermissions.user_id === user_id) {
                                                setIsDeactivateSelfModalVisible(true);
                                            } else {
                                                setIsDeactivateMemberModalVisible(true);
                                            }
                                        }}>
                                        {(userPermissions.user_id === user_id) ? "Leave" : "Deactivate"}
                                    </Button>
                                ) : null}
                                {/*/ Only show this button only if the following conditions are all met:
                                    1. The displayed user has a permission level of "INVITE" or "REQUEST" or "BASE"
                                       (In other words, the displayed user is not a project LEAD or ADMIN)
                                    2. The current user is a project lead
                                */}
                                {((permission_level === "INVITE" || permission_level === "REQUEST" || permission_level === "BASE") && userPermissions.is_project_lead)
                                    ? (
                                        <>
                                            <Button
                                                disabled={researchProjectData.is_archived}
                                                type={'default'}
                                                onClick={() => {
                                                    setSelectedUserId(user_id);
                                                    setIsDeleteModalVisible(true);
                                                }}
                                                icon={<DeleteOutlined />}
                                            >
                                                Delete
                                            </Button>
                                        </>
                                    ) : null
                                }
                                {/* Only show the prompt button if the user was invited to the project or hasn't joined yet*/}
                                {(permission_level === "INVITE" || permission_level === "REQUEST")
                                    ? (() => {
                                        const userLastPromptDate = getNumberOfDaysBetweenDates(new Date(prompt_date), new Date());
                                        return (
                                            <Popover
                                                content={
                                                    (prompt_date)
                                                        ? (userLastPromptDate > 1)
                                                            ? `This user was prompted to join the project ${userLastPromptDate} day(s) ago`
                                                            : `This user was already prompted to join the project today, please wait until tomorrow to try again.`
                                                        : `This user was not prompted to join the project`
                                                }
                                            >
                                                <Button
                                                    type={'default'}
                                                    icon={<MailOutlined />}
                                                    disabled={researchProjectData.is_archived || (userLastPromptDate < 1)}
                                                    onClick={() => {
                                                        triggerPromptUserToJoinProject({
                                                            userToPromptID: user_id,
                                                            projectID: researchProjectData.id,
                                                        }).then(({ data, error }) => {
                                                            if (error) {
                                                                renderFormErrors({ data: { error } });
                                                            } else {
                                                                // update the team member table with the date of the last prompt
                                                                const updatedTeamMemberIndex = displayedStudyTeam.findIndex(user => user.user_id === user_id);
                                                                if (updatedTeamMemberIndex > -1) {
                                                                    setDisplayedStudyTeam(displayedStudyTeam.map((teamMember, index) => {
                                                                        if (index === updatedTeamMemberIndex) {
                                                                            return {
                                                                                ...teamMember,
                                                                                prompt_date: new Date()
                                                                            };
                                                                        }
                                                                        return teamMember;
                                                                    }));
                                                                }
                                                                // send a notification to the user for the successful prompt
                                                                openNotification({
                                                                    placement: 'topRight',
                                                                    message: 'Prompted Team Member',
                                                                    description: `${data.success}`,
                                                                    icon: <CheckCircleOutlined
                                                                        style={{ color: 'green' }} />
                                                                });
                                                            }
                                                        }).catch(error => console.error("Error prompting user", error));
                                                    }}
                                                >
                                                    Prompt
                                                </Button>
                                            </Popover>
                                        );
                                    })()
                                    : null
                                }
                            </Space>
                        )
                    }))}
                    pagination={{ pageSize: 6 }}
                />
                {addTeamMemModal ? <UserPickerModal setIsAddUserModalVisible={setAddTeamMemModal}
                    IsAddUserModalVisible={addTeamMemModal}
                    projectID={researchProjectData.id}
                /> : ""}
                <Row justify={'end'}>
                    <Button
                        disabled={researchProjectData.is_archived}
                        className="add-new-team-member-button"
                        onClick={handleAddTeamMember}>
                        <TeamOutlined />Add Team Members
                    </Button>
                </Row>
            </div>
        </>
    );

    return (
        <>
            <ProjectDetailsVisitorView researchProjectData={researchProjectData} />
            {(researchProjectData?.user_permissions.is_active)
                ? (membershipRequiredElements)
                : null
            }
            {joinProjectBtn}


            {/* The delete member modal */}
            <ModalPopup
                title="Delete Member"
                visible={isDeleteModalVisible}
                handleOk={() => handleDeleteMemberCallback()}
                handleCancel={() => setIsDeleteModalVisible(false)}
                type="info"
                disableScreenTouch={true}
                footerButton="Delete Member"
                centered={true}
                width={650}
            >
                <Row align={'center'}>
                    <p style={userManagementStyles.warningTitle}>Warning!</p>
                    <h1 style={userManagementStyles.title}>
                        Deleting a member means all their data will be deleted including tasks and their messages that
                        are related to this project. Are you sure you want to delete this member from the project?
                    </h1>
                </Row>
            </ModalPopup>

            {/* The deactivate member modal */}
            <ModalPopup
                title="Deactivate Member"
                visible={isDeactivateModalVisible}
                handleOk={() => handleDeactivateMemberCallback()}
                handleCancel={() => setIsDeactivateMemberModalVisible(false)}
                type="info"
                disableScreenTouch={true}
                footerButton="Deactivate Member"
                centered={true}
                width={650}
            >
                <Row align={'center'}>
                    <p style={userManagementStyles.warningTitle}>Warning!</p>
                    <h1 style={userManagementStyles.title}>
                        Deactivating a member means all their data will be assigned to an anonymous member. Are you sure
                        you want to deactivate this member from this project?
                    </h1>
                </Row>
            </ModalPopup>

            <ModalPopup
                title="Leave Project"
                visible={isDeactivateSelfModalVisible}
                handleOk={() => handleDeactivateSelfCallback()}
                handleCancel={() => setIsDeactivateSelfModalVisible(false)}
                type="info"
                disableScreenTouch={true}
                footerButton="Leave Project"
                centered={true}
                width={650}
            >
                <Row align={'center'}>
                    <p style={userManagementStyles.warningTitle}>Warning!</p>
                    <h1 style={userManagementStyles.title}>
                        Are you sure you want to leave this project?
                    </h1>
                </Row>
            </ModalPopup>
        </>
    );
}


const userManagementStyles = {
    warningTitle: {
        fontSize: '1.5em',
        color: 'red',
        textAlign: 'center',
        fontWeight: 'bolder',
    },
    title: {
        fontSize: '1.2em',
        color: 'var(--primary-color-1)',
    }
};
