import { Button, Col, Row } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import ModalPopup from "../../utils/ModalPopup";
import React from "react";

export const DeleteTaskFileModal = (
    {
        isDeleteModalOpen,
        handleDeleteOk,
        handleDeleteCancel,
        handleDeleteAndDownloadOk,
        researchTaskFile,
        modalStyle,
        uploadedFileStyle,
        isLoadingFileDownload,
        isLoadingFileDeleteRequest
    }
) => {

    return (
        <ModalPopup
            title="Delete Project Task Document"
            visible={isDeleteModalOpen}
            handleOk={() => handleDeleteOk(researchTaskFile.fileType)}
            handleCancel={() => handleDeleteCancel()}
            type="info"
            disableScreenTouch={true}
            footerButton="Delete Document"
            loadingState={isLoadingFileDeleteRequest}
            centered={true}
            width={650}
            customFooter={
                (researchTaskFile.url)
                    ? null
                    : (
                        <Button type="info"
                            title={researchTaskFile.name}
                            loading={isLoadingFileDownload}
                            onClick={() => handleDeleteAndDownloadOk(
                                researchTaskFile.fileType,
                                researchTaskFile.research_project_id,
                                researchTaskFile.task_id,
                                researchTaskFile.file_id
                            )}
                            data-project-id={researchTaskFile.research_project_id}
                            data-task-id={researchTaskFile.task_id}
                            data-file-id={researchTaskFile.file_id}
                            style={modalStyle.OkButton}
                            icon={<DownloadOutlined />}
                        >
                            Download & Delete
                        </Button>
                    )
            }
        >
            <Row align={'center'}>
                <h1 style={uploadedFileStyle.warningTitle}>Warning!</h1>
                <h2 style={uploadedFileStyle.userDeleteTitle}>
                    You are about to delete a file submission. Please confirm the details
                    first and download the file if necessary.
                </h2>
            </Row>
            <Row>
                <Col span={12}>
                    <span style={uploadedFileStyle.fieldValue}>{researchTaskFile.title}</span>
                </Col>
            </Row>
        </ModalPopup>
    );
};
