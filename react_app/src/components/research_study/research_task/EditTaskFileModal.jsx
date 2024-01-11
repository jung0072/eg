import ModalPopup from "../../utils/ModalPopup";
import { Input, Row, Form } from "antd";
import React from "react";

const { Item } = Form;

export const EditTaskFileModal = (
    {
        isEditModalOpen,
        handleEditOk,
        handleEditCancel,
        researchTaskFile,
        setResearchTaskFile,
        isLoadingEditTaskResponse
    }
) => {

    const updateFileTitle = (inputEvent) => setResearchTaskFile((previous) => ({
        ...previous,
        updatedTitle: inputEvent.target.value,
    }));

    const updateFileURL = (inputEvent) => setResearchTaskFile((previous) => ({
        ...previous,
        updatedURL: inputEvent.target.value
    }));

    return (
        <ModalPopup
            title="Edit Project Task Document"
            visible={isEditModalOpen}
            handleOk={() => handleEditOk(researchTaskFile.fileType)}
            handleCancel={() => handleEditCancel()}
            type="info"
            disableScreenTouch={true}
            footerButton="Submit"
            centered={true}
            width={650}
            loadingState={isLoadingEditTaskResponse}
        >
            <Row>
                <Row>
                    <h2>You are about to update the file: {researchTaskFile.title}</h2>
                </Row>
            </Row>
            <Row>
                <Row span={12}>
                    <Item
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                        label={'Enter updated file name'}
                    >
                        <Input
                            className={'taskDocumentUpdate'}
                            value={researchTaskFile.updatedTitle}
                            onChange={updateFileTitle}
                        />
                    </Item>
                    {
                        (researchTaskFile.url)
                            ? (
                                <Item
                                    labelCol={{ span: 24 }}
                                    wrapperCol={{ span: 24 }}
                                    label={'Enter the updated file url'}
                                >
                                    <Input
                                        className={'taskDocumentUpdate'}
                                        onChange={updateFileURL}
                                        value={researchTaskFile.updatedURL}
                                    />
                                </Item>
                            )
                            : null
                    }
                </Row>
            </Row>
            <Row>
                <Row>
                    <p style={{ color: "red", fontSize: "smaller" }}>{researchTaskFile.error}</p>
                </Row>
            </Row>
        </ModalPopup>
    );
};
