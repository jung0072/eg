import React, { useState } from "react";
import { DeleteOutlined, EditOutlined, FilePdfOutlined, GlobalOutlined } from "@ant-design/icons";
import { Colours, EngageActionButton, ReportItem, checkAssociatedWithID } from "../../utils";
import { Button, Tooltip } from "antd";
import { Link } from "react-router-dom";
import { useEngageAction } from "../../../providers/EngageActionContextProvider";

export function UploadedFilesList(
    {
        uploadedFiles,
        handleFileDownload,
        isLoadingFileDownload,
        setIsEditFileModalOpen,
        setIsDeleteFileOpen,
        setEditingFile,
        width,
        canUserUpdateTask,
        uploadedFileStyle
    }
) {
    const [hoveredFile, setHoveredFile] = useState(null);

    // providers for report action button
    const { actionState } = useEngageAction();
    const { showMenuOptions, associatedWithID } = actionState;

    const handleMouseEnter = (file) => {
        setHoveredFile(file);
    };

    const handleMouseLeave = () => {
        setHoveredFile(null);
    };

    function handleFileDelete() {
        setIsDeleteFileOpen(true);
        setEditingFile({
            ...hoveredFile,
            fileId: hoveredFile.file_id,
            fileType: (hoveredFile.is_protocol_file) ? 'TASK_FILE' : 'SUBMITTED_FILE'
        });
    }

    function handleFileEdit() {
        setEditingFile((previous) => ({
            ...previous,
            ...hoveredFile,
            updatedTitle: hoveredFile.title.split('.').shift(),
            fileID: hoveredFile.file_id,
            url: hoveredFile.url,
            updatedURL: hoveredFile.url,
            fileType: (hoveredFile.is_protocol_file) ? 'TASK_FILE' : 'SUBMITTED_FILE'
        }));
        setIsEditFileModalOpen(true);
    }

    return (
        <div style={uploadedFileStyle.content_box}>
            <div style={uploadedFileStyle.uploaded_title}>Documents:</div>
            <div style={{ ...uploadedFileStyle.uploaded_title, fontSize: '14px', fontWeight: 400 }}>
                These files are required to participate on this research task. All team members can see these files.
            </div>
            <div style={uploadedFileStyle.content_box_files}>
                {uploadedFiles?.length !== 0 ? uploadedFiles?.map((file) => {
                    const {
                        research_project_id: projectID,
                        task_id: taskID,
                        file_id: fileID,
                        url,
                    } = file;

                    const isHovered = hoveredFile?.file_id === file?.file_id;
                    const isReporting = checkAssociatedWithID(associatedWithID, "FILE", fileID);

                    const fileTitle = (file.title.length > 25 && width <= 1160)
                        ? <>{file.title.slice(0, 28)}&hellip;</>
                        : <>
                            {
                                file.title.length > 45
                                    ? <>{file.title.slice(0, 28)}&hellip;</>
                                    : file.title
                            }
                        </>;
                    return (
                        <div
                            key={fileID}
                            style={{ fontSize: '1.5em' }}
                            onMouseEnter={() => handleMouseEnter(file)}
                            onMouseLeave={handleMouseLeave}
                        >
                            {url ? (
                                <GlobalOutlined style={{ color: Colours.PRIMARY_2 }} />
                            ) : (
                                <FilePdfOutlined style={{ color: 'red' }} />
                            )}
                            <Tooltip placement="top" title={file.title}>
                                {url ? (
                                    <a href={url} target={'_blank'} style={uploadedFileStyle.file_name}>
                                        {fileTitle}
                                    </a>
                                ) : (
                                    <Link
                                        to={"#"}
                                        onClick={handleFileDownload}
                                        style={uploadedFileStyle.file_name}
                                        data-project-id={projectID}
                                        data-task-id={taskID}
                                        data-file-id={fileID}
                                    >
                                        {fileTitle}
                                    </Link>
                                )}
                            </Tooltip>
                            {(isHovered || isReporting) && canUserUpdateTask && (
                                <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    className={"deleteProjectTaskFileButton"}
                                    style={uploadedFileStyle.fileDeleteButton}
                                    onClick={handleFileDelete}
                                >
                                </Button>
                            )}
                            {(isHovered || isReporting) && canUserUpdateTask && (
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    className={"editProjectTaskFileButton"}
                                    style={uploadedFileStyle.fileDeleteButton}
                                    onClick={handleFileEdit}
                                >
                                </Button>
                            )}
                            <div style={uploadedFileStyle.reportActionButton}>
                                {(isHovered || isReporting) && (
                                    <EngageActionButton
                                        itemID={file.file_id}
                                        isUseInPopover={false}
                                        engageActionStyle={uploadFilesListStyle.engageActionStyle}
                                        type="FILE"
                                        actionComponent={
                                            <ReportItem
                                                callbackReportButton={() => setHoveredFile(null)}
                                                callbackCancelButton={() => setHoveredFile(null)}
                                                reportingItemText={`Reporting file: ${file.title}`}
                                                reportData={{ id: file.file_id, type: "FILE" }}
                                            />
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    );
                }) : <div style={{ padding: '10%', fontWeight: 600 }}>
                    No files have been uploaded for this task yet.
                </div>
                }
            </div>
        </div>
    );
}

const uploadFilesListStyle = {
    engageActionStyle: {
        reportIconStyle: {
            fontSize: '16px',
            color: 'inherit',
            padding: '0 0.4em',
        },
        componentContainer: {
            right: '0px',
            bottom: '-8px',
            left: '40px',
            width: '268px',
        },
    }
}
