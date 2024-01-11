import React, { useCallback, useState } from "react";
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    FileAddOutlined,
    FileOutlined,
    InboxOutlined
} from "@ant-design/icons";
import { Alert, Button, Form, Input, Modal, Radio, Row, Typography, Upload } from "antd";
import { NotificationTypes, openNotification, renderFormErrors } from "../../utils";
import { acceptedResearchTaskFileTypes } from "../../utils/constants";
import { useUploadCloudDocumentMutation, useUploadFileMutation } from "../../../redux/services/researchTaskAPI";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { uploadFileWarning } from "../../utils/constants.strings";

const { Dragger } = Upload;
const { Item } = Form;
const { Text } = Typography;

const uploadFileStyles = {
    button: {
        borderRadius: '5px'
    }
};

export default function UploadFileModal({ modalVisible, setModalVisible, researchTaskData }) {
    const { task: taskData, is_task_owner: isTaskOwner } = researchTaskData;
    const [fileList, setFileList] = useState([]);
    const [fileType, setFileType] = useState("submission");
    const [triggerFileUpload, { isLoading: isLoadingFileUpload }] = useUploadFileMutation();
    const [triggerCloudDocumentUpload, { isLoading: isLoadingCloudDocumentUpload }] = useUploadCloudDocumentMutation();
    const [formHook] = Form.useForm();
    const [isCloudDocument, setIsCloudDocument] = useState(false);

    // callback function to handle when the user clicks submit and what happens on submit
    const handleClickSubmitForm = useCallback(() => formHook.submit(), [formHook]);
    const handleSubmitForm = useCallback((values) => {
        // Get the values for the project id, task id and the file type for upload and then send the request
        const { file_upload: fileToUpload, url, title } = formHook.getFieldsValue("file_upload");
        const {
            research_project_id: projectID,
            task_id: taskID
        } = taskData;

        // create the form data object for this request to upload the file
        const formDataObject = new FormData();

        // Check if we are uploading a cloud document or if we are uploading a file
        if (isCloudDocument) {
            formDataObject.append("url", url);
            formDataObject.append("title", title);
        } else {
            formDataObject.append("fileToUpload", fileToUpload.originFileObj);
        }
        formDataObject.append("projectID", projectID);
        formDataObject.append("taskID", taskID);
        formDataObject.append("fileType", fileType);

        // now submit the request using the form data, and based on the response we can show errors/ success messages
        // or log out the issues
        const mutationCallback = (isCloudDocument) ? triggerCloudDocumentUpload : triggerFileUpload;
        mutationCallback(formDataObject).then(({ data, error }) => {
            // show a popup notification for the success or error for this event
            if (data) {
                const { success } = data;
                openNotification({
                    placement: 'topRight',
                    message: 'Submitted Research Task File',
                    description: `${success}`,
                    icon: <CheckCircleOutlined style={{ color: 'green' }} />
                });

                // reset all the form fields and then close the modal
                formHook.resetFields();
                setFileList([]);
                setModalVisible(false);
            } else if (error) {
                renderFormErrors(error, null, "Error uploading file");
            }
        }).catch((err) => console.error("Error submitting research task file", err));
    }, [fileType, triggerFileUpload, setModalVisible, formHook, taskData, isCloudDocument, triggerCloudDocumentUpload]);

    // callback function to change the file type, this is only used if you are the task owner
    const handleChangeFileType = useCallback((radioEvent) => {
        setFileType(radioEvent.target.value);
    }, [setFileType]);

    const handleChangeDocumentType = useCallback((radioEvent) => setIsCloudDocument((radioEvent.target.value === 'cloud')), [setIsCloudDocument]);

    const uploadFileProps = {
        name: 'file_upload',
        multiple: false,
        showUploadList: true,
        maxCount: 1,
        fileList,
        accept: acceptedResearchTaskFileTypes.map(type => `.${type}`).toString(),
        beforeUpload: (file) => {
            // The image must be under 2MB
            const acceptedFileSizeLimit = file.size / 1024 / 1024 < 5;
            if (!acceptedFileSizeLimit) {
                openNotification({
                    placement: 'topRight',
                    message: 'File too big.',
                    description: `${file.name} must be smaller then 5MB`,
                    icon: (<ExclamationCircleOutlined style={{ color: 'red' }} />),
                    type: NotificationTypes.ERROR
                });
            }
            return acceptedFileSizeLimit || Upload.LIST_IGNORE;
        },
        onChange: (fileData) => {
            const { file } = fileData;
            formHook.setFieldValue('file_upload', file);
            setFileList([file]);
        },
        onRemove: () => {
            setFileList([]);
        },
        onPreview: () => null,
        customRequest: ({ onSuccess }) => setTimeout(() => onSuccess('ok'), 50),
    };

    return (
        <Modal centered={true} title={`Upload file to Research Task: ${taskData.title}`}
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={(
                <Button style={uploadFileStyles.button} type={"primary"} htmlType={"submit"}
                    loading={isLoadingFileUpload}
                    onClick={handleClickSubmitForm}
                    disabled={(isCloudDocument) ? false : fileList.length === 0}
                    icon={<FileAddOutlined />}
                >
                    Submit
                </Button>
            )}
            width={700}
        >
            <Form form={formHook} onFinish={handleSubmitForm} colon={false}>
                <Item label={"Is this a cloud document or a computer file?"} labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                >
                    <Radio.Group onChange={handleChangeDocumentType} value={(isCloudDocument) ? 'cloud' : 'file'}>
                        <Radio value={'file'}>File</Radio>
                        <Radio value={'cloud'}>Cloud Document</Radio>
                    </Radio.Group>
                </Item>
                {
                    (!isCloudDocument)
                        ? (
                            <Row justify={"center"}>
                                <Item name="file_upload" label={'Upload File:'} labelCol={{ span: 24 }}
                                    wrapperCol={{ span: 24 }}
                                    rules={[{ required: false, message: 'Title field is required' }]}
                                >
                                    <Dragger {...uploadFileProps} >
                                        <p className={"ant-upload-drag-icon"}>
                                            <InboxOutlined />
                                        </p>
                                        <Row justify={'center'} align={'center'}>
                                            <Text type={"secondary"}>
                                                Click or drag file to this area to upload a file to this research task
                                            </Text>
                                        </Row>
                                    </Dragger>
                                </Item>
                            </Row>
                        )
                        : (<>
                            <Item name={'title'} label={'Document Name'} labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[
                                    {
                                        required: true,
                                        message: "This field is required."
                                    }
                                ]}
                            >
                                <Input prefix={<FileOutlined />} placeholder={"Name of file"} />
                            </Item>
                            <Item name={'url'} label={'Document URL'} labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[
                                    {
                                        required: true,
                                        message: "This field is required."
                                    },
                                    {
                                        type: "url",
                                        message: "This field must be a valid url."
                                    }
                                ]}
                            >
                                <Input prefix={<FontAwesomeIcon icon={solid('globe')} />}
                                    placeholder={"https://www.url.com/"} />
                            </Item>
                        </>)
                }
                {(isTaskOwner)
                    ? <Row justify={"center"}>
                        <Item
                            label={"Is this file required for the task participants or is this file being submitted to the task for completion?"}
                            labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                        >
                            <Radio.Group onChange={handleChangeFileType} value={fileType}>
                                <Radio value={'protocol'}>Task Document</Radio>
                                <Radio value={'submission'}>Task Submission File</Radio>
                            </Radio.Group>
                        </Item>
                    </Row>
                    : null
                }
            </Form>
            <Alert
                message={"Reminder"}
                description={uploadFileWarning}
                type="warning"
                closable={true}
            />
        </Modal>
    );
}
