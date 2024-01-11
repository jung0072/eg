import { Button, Space, Table } from "antd";
import { DeleteOutlined, DownloadOutlined, EditOutlined, GlobalOutlined, WarningOutlined } from "@ant-design/icons";
import React from "react";
import { EngageActionButton, ReportItem } from "../../utils";
import { useEngageAction } from "../../../providers/EngageActionContextProvider";


export function SubmittedFilesTable(
    {
        submittedFiles,
        handleFileDownload,
        isLoadingFileDownload,
        unassignUser = false,
        setIsEditFileModalOpen,
        setIsDeleteFileOpen,
        setEditingFile,
        canUserUpdateTask,
        uploadedFileStyle
    }
) {
    // states to handle the report button
    const {
        toggleShowMenuOptions,
        setAssociatedWithID,
    } = useEngageAction();


    function handleFileDelete(clickEvent) {
        const fileId = clickEvent.currentTarget.getAttribute('data-file-id');
        const fileName = clickEvent.currentTarget.getAttribute('data-file-name');
        const fileURL = clickEvent.currentTarget.getAttribute(('data-file-url'));
        const fileType = clickEvent.currentTarget.getAttribute(('data-file-type'));
        const projectID = clickEvent.currentTarget.getAttribute('data-project-id');
        const taskID = clickEvent.currentTarget.getAttribute('data-task-id');

        setEditingFile((previous) => ({
            ...previous,
            title: fileName,
            fileId: fileId,
            url: fileURL,
            fileType,
            research_project_id: projectID,
            task_id: taskID,
            file_id: fileId,
        }));
        setIsDeleteFileOpen(true);
    }

    function handleFileEdit(clickEvent) {
        const fileId = clickEvent.currentTarget.getAttribute('data-file-id');
        const fileName = clickEvent.currentTarget.getAttribute('data-file-name');
        const fileURL = clickEvent.currentTarget.getAttribute(('data-file-url'));
        const fileType = clickEvent.currentTarget.getAttribute(('data-file-type'));

        setEditingFile((previous) => ({
            ...previous,
            title: fileName,
            file_id: fileId,
            updatedTitle: fileName.split('.').shift(),
            url: fileURL,
            updatedURL: fileURL,
            fileType
        }));
        setIsEditFileModalOpen(true);
    }

    const submittedFileColumns = [
        {
            title: 'File Name',
            dataIndex: 'title',
            key: 'title',
            render: (title) => (<p title={title}>
                    {
                        (title.length > 25)
                            ? <>{title.slice(0, 28)}&hellip;</>
                            : <>
                                {
                                    title.length > 45
                                        ? <>{title.slice(0, 39)}&hellip;</>
                                        : title
                                }
                            </>
                    }
                </p>
            )
        },
        {
            title: 'Submission Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (created_at) => (<p title={created_at}>
                {
                    <>{new Date(created_at).toLocaleDateString()}</>
                }
            </p>)
        },
        {
            title: 'Submitted By',
            dataIndex: 'uploader_name',
            key: 'uploader_name',
        },
        {
            title: 'Actions',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    {canUserUpdateTask && !unassignUser && (<Button
                        type={"default"}
                        icon={<DeleteOutlined />}
                        className={"deleteProjectTaskFileButton"}
                        style={uploadedFileStyle.fileDeleteButton}
                        onClick={handleFileDelete}
                        data-file-id={record.file_id}
                        data-file-url={record.url}
                        data-project-id={record.research_project_id}
                        data-task-id={record.task_id}
                        data-file-type={(record.is_protocol_file) ? 'TASK_FILE' : 'SUBMITTED_FILE'}
                        data-file-name={record.title}>
                        Delete
                    </Button>)}
                    {canUserUpdateTask && !unassignUser && (<Button
                        type="default"
                        icon={<EditOutlined />}

                        className={"editProjectTaskFileButton"}
                        style={uploadedFileStyle.fileDeleteButton}
                        data={record}
                        onClick={handleFileEdit}
                        data-file-id={record.file_id}
                        data-file-url={record.url}
                        data-file-type={(record.is_protocol_file) ? 'TASK_FILE' : 'SUBMITTED_FILE'}
                        data-file-name={record.title}>
                        Edit
                    </Button>)}
                    {
                        (record.url)
                            ? (
                                <Button
                                    type={'info'}
                                    href={record.url}
                                    style={{ ...uploadedFileStyle.fileDeleteButton, width: '118.1px' }}
                                    icon={<GlobalOutlined />}
                                    target={"_blank"}
                                >
                                    Open
                                </Button>
                            )
                            : <Button
                                title={record.name}
                                loading={isLoadingFileDownload}
                                onClick={handleFileDownload}
                                data-project-id={record.research_project_id}
                                data-task-id={record.task_id}
                                data-file-id={record.file_id}
                                data-file-type={(record.is_protocol_file) ? 'TASK_FILE' : 'SUBMITTED_FILE'}
                                style={uploadedFileStyle.fileDeleteButton}
                                icon={<DownloadOutlined />}
                                type="info"
                            >
                                Download
                            </Button>
                    }
                    <Button
                        icon={<WarningOutlined />}
                        onClick={() => {
                            toggleShowMenuOptions(true);
                            setAssociatedWithID(`FILE-${record.file_id}`);
                        }}
                        style={uploadedFileStyle.fileDeleteButton}
                        type="info"
                    >
                        Report
                    </Button>
                        <EngageActionButton
                            engageActionStyle={submittedFilesStyles.engageActionStyle}
                            itemID={record.file_id}
                            type={"FILE"}
                            showActionMenu={false}
                            isUseInPopover={false}
                            position="bottomRight"
                            actionComponent={
                                <ReportItem
                                    callbackCancelButton={() =>{
                                        toggleShowMenuOptions(true)
                                        setAssociatedWithID(`FILE-${record.file_id}`)
                                    }}
                                    reportData={{ id: record.file_id, type: "FILE" }}
                                    reportingItemText={record.title}
                                />
                            }
                        />
                </Space>
            ),
        },
    ];
    return (
        <div style={submittedFilesStyles.table_box}>
            <div style={submittedFilesStyles.submitted_title}>Submitted Files:</div>
            {unassignUser ? null : (
                <div style={{ ...uploadedFileStyle.uploaded_title, fontSize: '14px', fontWeight: 400 }}>
                    These files were submitted by the task participants. Only the task creator and Project Leads can
                    see these files.
                </div>
            )}
            {submittedFiles?.length === 0 ?
                <div style={{ padding: '7% 5%', fontWeight: 600 }}>No users have submitted this task yet </div> :
                <Table pagination={false} columns={submittedFileColumns} dataSource={submittedFiles} />
            }
        </div>
    );
}

const submittedFilesStyles = {
    table_box: {
        width: '100%',
        height: 'auto',
        border: '1px solid #D9D9D9',
        borderRadius: '8px',
        marginTop: '10px',
        padding: '10px',
        position: 'relative',
    },
    submitted_title: {
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: '16px',
        lineHeight: '16px',
        letterSpacing: '0.2px',
        color: '#002E6D',
        paddingBottom: '10px',
    },
    engageActionStyle: {
        componentContainer: {
            width: 'max-content',
            bottom: '36px',
            right: '81px',
        }
    }
};
