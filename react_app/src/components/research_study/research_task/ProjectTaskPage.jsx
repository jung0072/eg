import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { DeleteOutlined, ExclamationCircleOutlined, MailOutlined } from '@ant-design/icons';
import {Badge, Button, Col, Form, Popover, Row, Spin, Table, Tooltip} from 'antd';
import {
    useAssignTaskMutation,
    useDeleteProjectTaskFileMutation,
    useEditProjectTaskFileMutation,
    useGetTaskQuery
} from '../../../redux/services/researchTaskAPI.js';
import ProjectTaskView from '../../../screens/ProjectTaskView.jsx';
import useWindowDimensions from '../../utils/windowsDimensionHook.jsx';
import { Colours, Constants, EngageSpinner } from '../../utils/';
import { DOWNLOAD_TASK_FILE } from "../../../redux/api_url";
import { NotificationTypes, downloadFileBLOB, getEstimatedDates, getUserAuthorizationHeaders, openNotification } from "../../utils/common";
import { EngageActionButton, ReportItem } from "../../utils/index";
import { EditTaskFileModal } from "./EditTaskFileModal";
import { DeleteTaskFileModal } from "./DeleteTaskFileModal";
import { SubmittedFilesTable } from "./SubmittedFilesTable";
import { UploadedFilesList } from "./UploadedFilesList";
import { UnassignUserFromTaskModal } from "./UnassignUserFromTaskModal";
import { projectArchiveDisableActionString } from '../../utils/constants.strings.js';
import {PromptIncompleteTaskUserModal} from "./PromptIncompleteTaskUserModal";
import {DATE_TYPES} from "../../utils/constants";

const {
    DANGER,
    PRIMARY_1,
    SUCCESS
} = Colours;
const { HumanizedUserRoles } = Constants;
const { Item } = Form;

function TaskDescription({ description }) {
    let estimatedDueDate = "Not Set";

    const {
        due_date: end_date,
        is_using_due_date: is_using_end_date,
        due_date_type: end_date_type,
    } = description;

    if (is_using_end_date && end_date) {
        estimatedDueDate = getEstimatedDates({ is_using_end_date, end_date, end_date_type }, true).endDate;
    }

    return (
        <div style={taskDescriptionStyles.content_box}>
            <Row key={description.taskID} style={taskDescriptionStyles.task_title}>
                <Col span={21} style={{ color: PRIMARY_1 }}>{description.title}</Col>
                <Col offset={2} span={1}>
                    <EngageActionButton
                        engageActionStyle={taskDescriptionStyles.engageActionStyle}
                        itemID={description.taskID}
                        type={"TASK"}
                        actionComponent={
                            <ReportItem
                                reportData={{ id: description.taskID, type: "TASK" }}
                            />
                        }
                    />
                </Col>
            </Row>

            <div style={taskDescriptionStyles.task_description}>

                <div style={taskDescriptionStyles.row}>
                    <div>Task Created: <p style={{ color: SUCCESS }}>{description.created_at?.toLocaleDateString()}</p>
                    </div>
                    <div>Task Due: <p style={{ color: DANGER }}>{estimatedDueDate}</p></div>
                    <div>Task Creator: <p style={{ color: PRIMARY_1 }}>{description.task_creator}</p></div>
                    <div>Project Lead: <p style={{ color: PRIMARY_1 }}>{description.project_lead}</p></div>
                </div>

                <div style={taskDescriptionStyles.row}>
                    <div style={{ ...taskDescriptionStyles.large, }}>Subject: <span
                        style={{ color: PRIMARY_1 }}>{description?.subject || ""}</span></div>
                    <div style={{ gridColumn: '4 / -1', }}>
                        <div style={taskDescriptionStyles.nested_grid}>
                            {/* TODO: Add a type to the research task model and set this field*/}
                            {/*<div style={taskDescriptionStyles.nested_row}>*/}
                            {/*    Type: <a target="_blank" href={`${description.survey_link}`}>Survey</a>*/}
                            {/*</div>*/}
                            <div style={taskDescriptionStyles.nested_row}>Roles: {description.roles_required}</div>
                        </div>
                    </div>
                </div>

                <div style={taskDescriptionStyles.row}>
                    <div style={{ ...taskDescriptionStyles.single_column, }}>
                        <span style={{ color: PRIMARY_1 }}>Summary:</span> <p>{description.description}</p>
                    </div>
                </div>

            </div>
        </div>
    );
}

const projectTeamMemberColumns = [
    {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        sorter: (a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1),
        defaultSortOrder: 'ascend',
        sortDirections: ['ascend', 'descend'],
    },
    {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        sorter: (a, b) => (a.role.toLowerCase() < b.role.toLowerCase() ? -1 : 1),
        sortDirections: ['ascend', 'descend'],
    },
    {
        title: 'Comments',
        dataIndex: 'comments',
        key: 'comments',
        sorter: (a, b) => (a.comments.toLowerCase() < b.comments.toLowerCase() ? -1 : 1),
        sortDirections: ['ascend', 'descend'],
    },
    {
        title: 'Status',
        dataIndex: 'is_complete',
        key: 'is_complete',
        sorter: (a, b) => (b.is_complete - a.is_complete),
        sortDirections: ['ascend', 'descend'],
    },
];


function ProjectMembers({
    members,
    memberTableColumns,
    canManageUser,
    handleUnassignModal,
    currentUser,
    isAssigned,
    isProjectArchived,
}) {

    const projectTeamMemberDataSource = members.map((member, index) => ({
        key: index,
        name: member.name,
        role: HumanizedUserRoles[member.role],
        comments: member.comments || '',
        is_complete: (member.is_complete)
            ? (<Badge status="success" text="Completed" />)
            : (<Badge status="warning" text="Incomplete" />),
        user_id: member.id,
        is_complete_value: member.is_complete,
        is_prompted: member.is_prompted,
        prompted_date: new Date(member.prompted_date).toDateString()
    }));

    // set the state for modal
    const handleUnassignMyself = useCallback(() => {
        // get the user from the data source
        const currentUserData = projectTeamMemberDataSource.filter((teamData) => teamData.user_id === currentUser.user_id);
        handleUnassignModal(currentUserData[0]);
    }, [projectTeamMemberDataSource]);

    return (
        <div className="task-member-table" style={projectMemberStyles.content_box}>
            <Row style={{ marginBottom: '1rem' }} align={'middle'} justify={'space-between'}>
                <div style={projectMemberStyles.title}>Members ({members.length})</div>
                {isAssigned && !canManageUser && (
                    <Tooltip title={isProjectArchived && projectArchiveDisableActionString}>
                        <span>
                            <Button disabled={isProjectArchived} onClick={handleUnassignMyself} style={projectMemberStyles.buttonUnassign}>
                                Unassign Myself
                            </Button>
                        </span>
                    </Tooltip>
                )}
            </Row>
            <Table dataSource={projectTeamMemberDataSource} columns={memberTableColumns} />
        </div>
    );
}

const INITIAL_FILE_STATE = {
    url: null, id: null, title: null, error: null, updatedTitle: null
};

export default function ProjectTaskPage() {
    // default task id, change this when accessing particular task from project view
    const { id: taskID, } = useParams();

    const [isTaskOwner, setIsTaskOwner] = useState(false);
    const [taskDescription, setTaskDescription] = useState({});
    const [taskMembers, setTaskMembers] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [submittedFiles, setSubmittedFiles] = useState([]);
    const [hasUpdatingPermissions, setHasUpdatingPermissions] = useState(false);
    const [isLoadingFileDownload, setIsLoadingFileDownload] = useState(false);
    const [isEditFileModalOpen, setIsEditFileModalOpen] = useState(false);
    const [editingFile, setEditingFile] = useState({ ...INITIAL_FILE_STATE });
    const [isDeleteFileModalOpen, setIsDeleteFileModalOpen] = useState(false);

    const [canManageUser, setCanManageUser] = useState(false);
    const [teamMemberTable, setTeamMemberTable] = useState(projectTeamMemberColumns);
    const [unassignModal, setUnassignModal] = useState(false);
    const [promptUserModal, setPromptUserModal] = useState(false);
    const [promptAllUsers, setPromptAllUsers] = useState(false);
    const [selectedPromptUserData, setSelectedPromptUserData] = useState({
        taskId: null,
        projectId: null,
        userId: null,
        userName: null,
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [unassignModalData, setUnassignModalData] = useState(null);
    const { width } = useWindowDimensions();

    const [deleteProjectTaskFile, {
        isLoading: isLoadingDeleteData,
    }] = useDeleteProjectTaskFileMutation();

    const [editProjectTaskFile, {
        isLoading: isLoadingEditTaskData,
    }] = useEditProjectTaskFileMutation();
    const {
        data,
        isLoading: isLoadingResearchTaskData,
        isSuccess,
        isError
    } = useGetTaskQuery(taskID);

    const navigate = useNavigate();

    const [deleteMember, { isLoading: isLoadingMemberDeletion }] = useAssignTaskMutation();

    const deleteFileAndDownload = (projectID, taskID, fileID, deleteFile, fileType) => {
        setIsLoadingFileDownload(true);
        // create the download link using the files above and set up a string variable to save the response file name
        // after getting the authorization headers for the user start the fetch and download the file
        const downloadLink = `${process.env.REACT_APP_BASE_URL}api/project/${projectID}/${taskID}${DOWNLOAD_TASK_FILE}${fileID}/`;
        let downloadedFileName = '';
        const headers = getUserAuthorizationHeaders();
        fetch(downloadLink, { method: 'GET', headers: headers }).then(response => {
            downloadedFileName = response.headers.get('content-disposition').split('filename=')[1];
            return response;
        }).then(response => response.blob()).then((fileBlob) => downloadFileBLOB(fileBlob, downloadedFileName)
        ).then(async () => {
            await deleteProjectTaskFile({
                'fileId': fileID,
                'fileType': fileType,
                'projectId': projectID,
                'taskId': taskID,
            }).then(({ data, error }) => {
                if (data) {
                    if (fileType === "SUBMITTED_FILE")
                        setSubmittedFiles(data);
                    else
                        setUploadedFiles(data);
                }
                if (error) {
                    openNotification({
                        message: `Error while Deleting!`,
                        description: error?.data?.detail,
                        placement: 'topRight',
                        icon: (<ExclamationCircleOutlined style={{ color: 'red' }} />),
                        type: NotificationTypes.ERROR
                    });
                }
            });

        }).catch(console.error).finally(() => setIsLoadingFileDownload(false));
    };

    // callback functions for editing a research task file
    const handleEditOk = async (fileType) => {
        // First check if this is a url edit or a title edit and add the properties to the update event
        const updatedValues = {};
        if (editingFile.title !== editingFile.updatedTitle && editingFile.updatedTitle) {
            updatedValues.taskUpdateName = editingFile.updatedTitle;
        }
        if (editingFile.url !== editingFile.updatedURL && editingFile.updatedURL) {
            updatedValues.taskUpdateURL = editingFile.updatedURL;
        }
        // If we aren't updating any values, then make sure to return early and close the modal
        if (updatedValues.taskUpdateURL || updatedValues.taskUpdateName) {
            const response = await editProjectTaskFile({
                'projectId': data.task.research_project_id,
                'taskId': taskID,
                'fileID': editingFile.file_id,
                'fileType': fileType,
                ...updatedValues
            });
            if (response.error) {
                setEditingFile((previous) => ({ ...previous, error: response.error?.data?.detail ?? response.error?.data }));
                return;
            } else {
                if (fileType === 'TASK_FILE') {
                    setUploadedFiles(response.data);
                } else if (fileType === 'SUBMITTED_FILE') {
                    setSubmittedFiles(response.data);
                }
            }
        }

        // close the modal and wipe out the editing file
        setIsEditFileModalOpen(false);
        setEditingFile({ ...INITIAL_FILE_STATE });
    };

    const handleEditCancel = () => {
        setIsEditFileModalOpen(false);
        setEditingFile({ ...INITIAL_FILE_STATE });
    };

    // callback functions for deleting a research task file
    const handleDeleteOk = async (fileType) => {
        await deleteProjectTaskFile({
            'fileId': editingFile.fileId,
            'fileType': fileType,
            'projectId': data.task.research_project_id,
            'taskId': taskID
        }).then(({ data, error }) => {
            if (data) {
                if (fileType === 'TASK_FILE') {
                    setUploadedFiles(data);
                }
                else if (fileType === 'SUBMITTED_FILE') {
                    setSubmittedFiles(data);
                }
            }
            if (error) {
                openNotification({
                    message: `Error while Deleting!`,
                    description: error?.data?.detail,
                    placement: 'topRight',
                    icon: (<ExclamationCircleOutlined style={{ color: 'red' }} />),
                    type: NotificationTypes.ERROR
                });
            }
        });

        setIsDeleteFileModalOpen(false);
        setEditingFile({ ...INITIAL_FILE_STATE });
    };

    function handleDeleteAndDownloadOk(fileType, projectID, taskID, fileID) {
        deleteFileAndDownload(projectID, taskID, fileID, editingFile, fileType);
        setIsDeleteFileModalOpen(false);
        setEditingFile({ ...INITIAL_FILE_STATE });
    }

    const handleDeleteCancel = () => {
        setIsDeleteFileModalOpen(false);
    };

    const handleDownloadFileClick = (clickEvent) => {
        // first start the file download, and get the project, task and file id from the html node clicked
        setIsLoadingFileDownload(true);
        const projectID = clickEvent.currentTarget.getAttribute('data-project-id');
        const taskID = clickEvent.currentTarget.getAttribute('data-task-id');
        const fileID = clickEvent.currentTarget.getAttribute('data-file-id');

        // create the download link using the files above and set up a string variable to save the response file name
        // after getting the authorization headers for the user start the fetch and download the file
        const downloadLink = `${process.env.REACT_APP_BASE_URL}api/project/${projectID}/${taskID}${DOWNLOAD_TASK_FILE}${fileID}/`;
        let downloadedFileName = '';
        const headers = getUserAuthorizationHeaders();
        fetch(downloadLink, { method: 'GET', headers: headers }).then(response => {
            downloadedFileName = response.headers.get('content-disposition').split('filename=')[1];
            return response;
        }).then(response => response.blob()).then((fileBlob) => downloadFileBLOB(fileBlob, downloadedFileName)
        ).catch(console.error).finally(() => setIsLoadingFileDownload(false));
    };

    // API call to unassign user from the task
    const handleUnassignMember = useCallback(() => {
        deleteMember({
            projectID: data.task.research_project_id,
            taskID, assigned_user: selectedUser,
            method: 'DELETE'
        }).then((res) => {
            const { error, data: resData } = res;
            const notificationType = error ? 'error' : 'success';
            const description = error ? error?.data?.error ?? error?.data?.detail : resData?.success;
            setUnassignModal(false);
            // if "unassign myself" is clicked navigate to the project page
            if (selectedUser === data.user_permissions.user_id && !error?.data?.detail) {
                navigate(`/app/research_study/${data.task.research_project_id}/`);
            }

            openNotification({
                placement: 'topRight',
                type: notificationType,
                description: description
            });
        });
    });

    // set the data required for the modal popup
    const handleUnassignModal = (item) => {
        setSelectedUser(item.user_id);
        setUnassignModal(true);

        // find all the files submitted by the user
        const userSubmittedFile = data.submitted_files.filter((fileData) => fileData.uploaderId === item.user_id);
        setUnassignModalData({ userDetail: item, submittedFiles: userSubmittedFile });
    };

    const handlePromptIncompleteTaskUsers = (item, allUsers = false) => {
        if (allUsers) {
            setPromptAllUsers(true);
            setSelectedPromptUserData({
                userId: "All Users",
                taskId: data.task.task_id,
                projectId: data.task.research_project_id,
                userName: "all the Users",
            });
        } else {
            setSelectedPromptUserData({
                userId: item.user_id,
                taskId: data.task.task_id,
                projectId: data.task.research_project_id,
                userName: item.name,
            });
        }

        setPromptUserModal(true)
    };

    useEffect(() => {
        if (isSuccess) {
            // map roles with the ROLES and print it in string format comma separated
            const rolesRequiredList = data.roles_required || [];
            const mappedRoles = rolesRequiredList.map((role) => {
                const matchedRole = Constants.TASK_ROLES.find((r) => r.value === role);
                // eslint-disable-next-line react/no-array-index-key
                return matchedRole ? matchedRole.label : '';
            });
            const roles_required = mappedRoles.filter(Boolean).join(', ');
            setIsTaskOwner(data.is_task_owner);
            const {
                created_at: rawCreatedAt,
                due_date: rawDueDate,
                is_using_due_date,
                due_date_type,
            } = data.task;

            const created_at = new Date(rawCreatedAt);
            const due_date = new Date(rawDueDate);

            setTaskDescription({
                ...data.task,
                created_at,
                due_date,
                is_using_due_date,
                due_date_type,
                roles_required,
                task_creator: data.task_creator,
                taskID,
                project_lead: data.project_lead
            });

            setTaskMembers(data.members);
            setUploadedFiles(data.uploaded_files);
            setSubmittedFiles(data.submitted_files);
            const permissions = data['user_permissions'];
            const hasPermissions = permissions?.['is_project_lead'] ||
                permissions?.['is_principal_investigator'] || data?.['is_task_owner'] || data?.['is_admin'];
            setHasUpdatingPermissions(hasPermissions);

            // if it's PI, Lead or task owner add the Unassign button in the table
            if (hasPermissions) {
                // Check if an item with the key 'user_id' already exists
                const isUserInTable = teamMemberTable.some(item => item.key === 'user_id');

                if (!isUserInTable) {
                    const updatedTeamMemberTable = [...teamMemberTable, {
                        title: (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ flex: 1 }}>Actions</span>
                                <Button
                                    title={'Prompt All users with an incomplete task'}
                                    type={'default'}
                                    icon={<MailOutlined />}
                                    onClick={() => handlePromptIncompleteTaskUsers(null,true)}
                                    >
                                        Prompt All
                                </Button>
                            </div>
                        ),
                        dataIndex: 'user_id',
                        key: 'user_id',
                        render: (_, item) => {
                            const isOwner = (item.user_id === data.task.task_creator_id);
                            const isProjectArchived = data.task.research_project_archive

                            return (
                                <Tooltip
                                >
                                    <Button
                                        title={
                                        isProjectArchived
                                            ? projectArchiveDisableActionString
                                            : isOwner
                                                ? "Task Owner cannot be unassigned"
                                                : null
                                        }
                                        type={'default'}
                                        onClick={() => handleUnassignModal(item)}
                                        icon={<DeleteOutlined />}
                                        disabled={isProjectArchived || isOwner}
                                    >
                                        Unassign
                                    </Button>
                                    <Popover
                                            content={
                                                item.is_complete_value ?
                                                    "User already completed this task"
                                                    : item.is_prompted ?
                                                        "User was last prompted on: " + item.prompted_date :
                                                        "Prompt user to complete this task"

                                            }
                                        >
                                            <Button
                                            type={'default'}
                                            onClick={() => handlePromptIncompleteTaskUsers(item)}
                                            disabled={item.is_complete_value}
                                            icon={<MailOutlined />}
                                            style={{marginLeft:'5px'}}
                                            >
                                                Prompt
                                        </Button>
                                    </Popover>
                                </Tooltip >
                            );
                        },
                    }];
                    setTeamMemberTable(updatedTeamMemberTable);
                    setCanManageUser(true);
                }
            }

        }
    }, [data]);

    if (isLoadingResearchTaskData) {
        return (<EngageSpinner loaderText={"loading research task data"} />);
    }
    return (
        <ProjectTaskView status={taskDescription.due_status} researchTaskData={data}>
            {isSuccess ? (
                <>
                    <TaskDescription description={{ ...taskDescription, taskID }} />
                    <ProjectMembers members={taskMembers} memberTableColumns={teamMemberTable}
                        canManageUser={canManageUser} handleUnassignModal={handleUnassignModal}
                        currentUser={data?.user_permissions} isAssigned={data?.is_assigned}
                        isProjectArchived={data.task.research_project_archive}
                    />
                    <UploadedFilesList
                        uploadedFiles={uploadedFiles}
                        handleFileDownload={handleDownloadFileClick}
                        isLoadingFileDownload={isLoadingFileDownload}
                        setIsEditFileModalOpen={setIsEditFileModalOpen}
                        setIsDeleteFileOpen={setIsDeleteFileModalOpen}
                        setEditingFile={setEditingFile}
                        width={width}
                        canUserUpdateTask={hasUpdatingPermissions}
                        uploadedFileStyle={uploadedFileStyle}
                    />
                    {
                        (isTaskOwner || data?.user_permissions?.is_principal_investigator || data?.user_permissions?.is_project_lead || data?.user_permissions?.is_admin)
                            ? (
                                <>
                                    <SubmittedFilesTable
                                        submittedFiles={submittedFiles}
                                        handleFileDownload={handleDownloadFileClick}
                                        isLoadingFileDownload={isLoadingFileDownload}
                                        setIsEditFileModalOpen={setIsEditFileModalOpen}
                                        setIsDeleteFileOpen={setIsDeleteFileModalOpen}
                                        setEditingFile={setEditingFile}
                                        width={width}
                                        canUserUpdateTask={hasUpdatingPermissions}
                                        uploadedFileStyle={uploadedFileStyle}
                                    />
                                    <EditTaskFileModal
                                        handleEditOk={handleEditOk}
                                        handleEditCancel={handleEditCancel}
                                        isEditModalOpen={isEditFileModalOpen}
                                        researchTaskFile={editingFile}
                                        setResearchTaskFile={setEditingFile}
                                        isLoadingEditTaskResponse={isLoadingEditTaskData}
                                    />
                                    <DeleteTaskFileModal
                                        isDeleteModalOpen={isDeleteFileModalOpen}
                                        handleDeleteOk={handleDeleteOk}
                                        handleDeleteCancel={handleDeleteCancel}
                                        handleDeleteAndDownloadOk={handleDeleteAndDownloadOk}
                                        researchTaskFile={editingFile}
                                        modalStyle={modalStyle}
                                        uploadedFileStyle={uploadedFileStyle}
                                        isLoadingFileDownload={isLoadingFileDownload}
                                        isLoadingFileDeleteRequest={isLoadingDeleteData}
                                    />
                                </>
                            ) : ''}
                    {
                        unassignModal
                            ? (
                                <UnassignUserFromTaskModal
                                    isUnassignModalVisible={unassignModal}
                                    handleUnassignMember={handleUnassignMember}
                                    setIsUnassignModalVisible={setUnassignModal}
                                    isLoadingMemberDeletion={isLoadingMemberDeletion}
                                    modalStyles={projectMemberStyles}
                                    unassignModalData={unassignModalData}
                                    researchTask={data}
                                    userFileList={(
                                        <SubmittedFilesTable
                                            submittedFiles={unassignModalData.submittedFiles}
                                            handleFileDownload={handleDownloadFileClick}
                                            isLoadingFileDownload={isLoadingFileDownload}
                                            setIsEditFileModalOpen={setIsEditFileModalOpen}
                                            setIsDeleteFileOpen={setIsDeleteFileModalOpen}
                                            setEditingFile={setEditingFile}
                                            width={width}
                                            canUserUpdateTask={hasUpdatingPermissions}
                                            uploadedFileStyle={uploadedFileStyle}
                                            unassignUser
                                        />
                                    )}
                                />
                            )
                            : ''
                    }
                    {
                        promptUserModal ?
                            (
                                <PromptIncompleteTaskUserModal
                                    isModalVisible={promptUserModal}
                                    data={selectedPromptUserData}
                                    promptAllUsers={promptAllUsers}
                                    setModalVisible={setPromptUserModal}
                                    setSelectedPromptUserData={setSelectedPromptUserData}
                                    setPromptAllUsers={setPromptAllUsers}
                                />

                            ) : ''
                    }
                </>
            ) : (
                <>
                    {isLoadingResearchTaskData ? (
                        <Spin />
                    ) : (
                        <>
                            {isError ? (
                                <div>
                                    Error in retrieving the task that you are trying to access
                                </div>
                            ) : (
                                ''
                            )}
                        </>
                    )}
                </>
            )}
        </ProjectTaskView>
    );
}

const taskDescriptionStyles = {
    content_box: {
        width: '100%',
        height: 'auto',
        border: '1px solid #D9D9D9',
        borderRadius: '8px',
        marginTop: '10px',
        marginBottom: '1em',
        padding: '10px',
        position: 'relative',
        backgroundColor: '#FAFAFA',
    },
    task_title: {
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: '24px',
        lineHeight: '42px',
        letterSpacing: '0.1px',
        color: '#52575C',
        marginBottom: '10px',
    },
    content_style: {
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: '16px',
        lineHeight: '19px',
        letterSpacing: '0.2px',
    },
    task_description: {
        display: 'grid',
        gridTemplateRows: 'auto auto auto',
        gridGap: '10px',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: '16px',
        lineHeight: '19px',
        letterSpacing: '0.2px',
        color: '#52575C',
        textAlign: 'left',
    },
    row: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridGap: '10px',
    },
    large: {
        gridColumn: '1 / span 2',
    },
    single_column: {
        gridColumn: '1 / -1',
    },
    nested_grid: {
        display: 'grid',
        gridTemplateRows: '1fr 1fr',
        gridGap: '10px',
    },
    nested_row: {
        textAlign: 'left',
    },
    engageActionStyle: {
        reportIconStyle: {
            fontSize: '1.5rem',
        },
        popoverPosition: 'topRight'
    }
};

const projectMemberStyles = {
    content_box: {
        width: '100%',
        height: 'auto',
        border: '1px solid #D9D9D9',
        borderRadius: '8px',
        padding: '10px',
        position: 'relative',
        marginBottom: '1em'
    },
    title: {
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: '18px',
        lineHeight: '16px',
        letterSpacing: '0.2px',
        color: 'var(--primary-color-1)',
    },
    buttonUnassign: {
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: '16px',
        lineHeight: '16px',
        letterSpacing: '0.2px',
        color: 'white',
        backgroundColor: "var(--primary-color-1)",
        height: '40px',
        borderRadius: '15px',
    },
    table_heading: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        textAlign: 'left',
        fontWeight: '500',
        fontSize: '16px',
        lineHeight: '42px',
        letterSpacing: '0.1px',
        textDecorationLine: 'underline',
        color: '#52575C',
    },
    container: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridAutoRows: 'minmax(0, 1fr)',
        height: 'auto',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: '16px',
        lineHeight: '24px',
        letterSpacing: '0.1px',
    },
    row: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
    },
    user_name: {
        padding: '8px 8px 8px 0px',
        color: PRIMARY_1,
        fontWeight: 500,
    },
    user_role: {
        padding: '8px 8px 8px 0px',
        color: '#52575C',
    },
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

const modalStyle = {
    OkButton: {
        boxShadow: '0px 4px 4px 0px #00000040',
        minWidth: '180px',
        height: '48px',
        borderRadius: '75px',
        backgroundColor: '#002E6D',
        color: '#FFFFFF',
        fontWeight: '500',
        fontSize: '16px'
    }
};

const uploadedFileStyle = {
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
    warningTitle: {
        color: 'red',
        textAlign: 'center',
        fontWeight: 'bolder',
    },
    content_box: {
        width: '100%',
        height: 'auto',
        border: '1px solid #D9D9D9',
        borderRadius: '8px',
        marginTop: '10px',
        padding: '10px',
        position: 'relative',
    },
    uploaded_title: {
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: '18px',
        lineHeight: '16px',
        letterSpacing: '0.2px',
        color: '#002E6D',
        paddingBottom: '10px',
    },
    content_box_files: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        padding: '20px 20px 20px 0px',
        gap: '10px',
    },
    file_name: {
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: '16px',
        lineHeight: '24px',
        letterSpacing: '0.1px',
        color: '#52575C',
        paddingLeft: '1em',
        cursor: 'pointer',
    },
    fileDeleteButton: {
        visibility: 'visible',
        transition: 'visibility 0.3s',
        cursor: 'pointer',
        leftPadding: '5px',
    },
    reportActionButton: {
        visibility: 'visible',
        transition: 'visibility 0.3s',
        cursor: 'pointer',
        leftPadding: '5px',
        display: 'inline-flex',
        height: '32px',
        width: '32px',
        padding: '2.4px 0',
        borderRadius: '2px',
        verticalAlign: '-3px',
    },
};