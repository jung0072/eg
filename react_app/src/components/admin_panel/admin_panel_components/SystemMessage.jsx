import React from 'react'
import { useNavigate, useParams } from 'react-router-dom';

import { Button, Typography, Radio, Popconfirm } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import { Editor } from "react-draft-wysiwyg";
import ModalPopup from '../../utils/ModalPopup';

import { usePostSystemMessageMutation, useUpdateSystemMessageMutation, useDeleteSystemMessageMutation } from "../../../redux/services/adminAPI"
import { useGetSystemMessageQuery } from "../../../redux/services/userAPI"
import { openNotification } from "../../utils";

import '../../../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './system_message.css'

export default function SystemMessage() {
    const navigate = useNavigate();

    const { id: messageId } = useParams();

    const { data: fetchedMessage, error, isLoading, refetch } = useGetSystemMessageQuery(messageId)
    const [data, setData] = React.useState({ title: "", type: "", content: EditorState.createEmpty(), is_published: false });
    const [notificationRadioBtnDisabled, setNotificationRadioBtnDisabled] = React.useState(false);
    const [draftContinueModalVisible, setDraftContinueModalVisible] = React.useState(false);
    const [firstLoading, setFirstLoading] = React.useState(true);


    React.useEffect(() => {
        if (messageId) {
            // If we are editing an existing message, it means that the admin is on non-notification message
            // We need to disable the notification radio button to prevent the admin from changing the type
            setNotificationRadioBtnDisabled(true)
            // When we are editing an existing message, skip the rest of this hook
            // because we don't want to load draft from local storage
            return
        }

        // Load draft from local storage for the first loading
        const draft = localStorage.getItem('systemMessage')

        // If there is no draft leave data state empty
        if (!draft) {
            return
        }
        else {
            // If there is draft from local storage, 
            // parse it and load it to data state
            const parsedDraft = JSON.parse(draft)
            // Convert raw data to editorState
            const convertedContent = convertFromRaw(parsedDraft.content)
            // Create editorState with converted content and change data
            parsedDraft.content = EditorState.createWithContent(convertedContent)
            // Set data state
            setData(parsedDraft)
            // Show modal to ask if the admin wants to continue working on the draft
            setDraftContinueModalVisible(true)
        }
    }, [])

    // Fetch message from server if messageId is passed
    React.useEffect(() => {
        if (messageId) {
            refetch()
        }
    }, [messageId])

    // Once message is fetched convert it to an editorState and set the data state
    React.useEffect(() => {
        if (!fetchedMessage) return
        const parsedContent = JSON.parse(fetchedMessage.content)
        const convertedContent = convertFromRaw(parsedContent)
        const editorState = EditorState.createWithContent(convertedContent)
        setData({
            title: fetchedMessage.title,
            type: fetchedMessage.type,
            content: editorState,
            is_published: fetchedMessage.is_published
        })
    }, [fetchedMessage])

    // Save draft to local storage when the data state changes
    // so that user can work on it later when they accidentally exit the page
    React.useEffect(() => {
        // Skip the first loading
        if (firstLoading) {
            setFirstLoading(false)
            return
        }
        // Do not save draft if the message type is notification
        if (data.type === 'NOTIFICATION' || data.type === 'EMAIL') {
            localStorage.removeItem('systemMessage')
            return
        }

        // Convert the current editorState to raw data
        const rawData = {
            ...data, content: convertToRaw(data.content.getCurrentContent())
        }

        // Save raw data to local storage
        localStorage.setItem('systemMessage', JSON.stringify(rawData))
    }, [data])

    // Mutation functions
    const [postSystemMessage] = usePostSystemMessageMutation();
    const [updateSystemMessage] = useUpdateSystemMessageMutation();
    const [deleteSystemMessage] = useDeleteSystemMessageMutation();

    // Update or Post a message
    const handlePostAndSaveBtns = (ev) => {
        // When the user clicks yes btn on popconfirm, it is save btn
        const btnType = ev.target.innerText
        if (btnType === 'Yes') {
            setData(prev => ({ ...prev, is_published: true }))
        }

        // Convert editorState to raw data before saving to database
        var content;
        if (data.type === 'NOTIFICATION' || data.type === 'EMAIL') {
            content = document.getElementById('notificationInputBox').value
            if (content === '') {
                alert('Please enter a notification message')
                return
            }
        } else {
            content = JSON.stringify(convertToRaw(data.content.getCurrentContent()))
        }

        const rawData = { ...data, content: content }

        if (messageId) {
            updateSystemMessage({ messageData: rawData, messageId: messageId }).then(
                (apiResponse) => {
                    const { error } = apiResponse;
                    if (error) {
                        console.log("update systemMessage error:", error)
                    }
                    else {
                        // Delete local storage data
                        localStorage.removeItem('systemMessage')
                        // Show success message
                        openNotification({
                            type: 'success',
                            message: "Message Updated Successfully",
                            description: `Your message has been updated successfully. You will be redirected to the Blogs & News page in 5 seconds.`,
                            placement: 'topRight',
                            icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                            callback: () => navigate('/system_message')
                        });
                    }
                }
            )
        } else {
            postSystemMessage(rawData).then(
                (apiResponse) => {
                    const { error } = apiResponse;
                    if (error) {
                        console.log("post systemMessage error:", error)
                    } else {
                        // Delete local storage data
                        localStorage.removeItem('systemMessage')
                        // Show success message
                        openNotification({
                            type: 'success',
                            message: "Message Posted Successfully",
                            description: `Your message has been posted successfully. You will be redirected to the Blogs & News page in 5 seconds.`,
                            placement: 'topRight',
                            icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                            callback: () => navigate('/system_message')
                        });
                    }
                }
            )
        }
    }

    // Cancel writing a message
    const handleCancelBtn = () => {
        // Delete local storage data
        localStorage.removeItem('systemMessage')
        navigate(-1)
    }

    // Delete a message
    const handleDeleteBtn = () => {
        deleteSystemMessage(messageId).then(
            (apiResponse) => {
                const { error } = apiResponse;
                if (error) {
                    console.log("delete systemMessage error:", error)
                } else {
                    localStorage.removeItem('systemMessage')
                    // Show success message
                    openNotification({
                        type: 'success',
                        message: "Message Deleted Successfully",
                        description: `Your message has been deleted successfully. You will be redirected to the Blogs & News page in 5 seconds.`,
                        placement: 'topRight',
                        icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                        callback: () => navigate('/system_message')
                    });
                }
            }
        )
    }

    function handleContinueBtnOnModal() {
        setDraftContinueModalVisible(false)
    }

    function handleCancelBtnOnModal() {
        setDraftContinueModalVisible(false)
        setData({ title: "", type: "", content: EditorState.createEmpty() })
    }


    return (
        <>
            <form className='systemMessageContainer'>
                <Typography.Title level={1}>Blogs & News</Typography.Title>
                <div className='inputWrapper'>
                    <label className='label' htmlFor="title">Title</label>
                    <input className='titleInput' type='text' name='title' value={data?.title} onChange={(ev) => { setData(prev => ({ ...prev, title: ev.target.value })) }} maxLength="90" />
                </div>
                <div className='inputWrapper'>
                    <span className='label' >Type</span>
                    <Radio.Group onChange={(ev) => {
                        setData(prev => ({ ...prev, type: ev.target.value }))
                    }} value={data.type}>
                        <Radio value={'NOTIFICATION'} disabled={notificationRadioBtnDisabled} >Notification</Radio>
                        <Radio value={'BLOG'} checked>Blog</Radio>
                        <Radio value={'EMAIL'} checked>Email</Radio>
                    </Radio.Group>
                </div>
                <div className='editor'>
                    {
                        (data.type === 'NOTIFICATION' || data.type === 'EMAIL')
                            ? <div className="notificationMessage"><span>This message will be sent to all users.
                    </span>
                                <textarea
                                    rows={5}
                                    id="notificationInputBox"
                                    name="notificationContent"
                                    autoFocus
                                    maxLength={(data.type === 'NOTIFICATION') ? "380" : '5000'}
                                    className="notificationInputBox"
                                />
                            </div>
                            :
                            <Editor
                                editorState={data.content}
                                toolbarClassName=""
                                wrapperClassName="wrapperClassName"
                                editorClassName="editorClassName"
                                onEditorStateChange={(editorState) => {
                                    setData(prev => ({ ...prev, content: editorState }));
                                }}
                            />
                    }
                </div>
                <div className='systemMessageButtons'>
                    <div className='systemMessageButtons__right'>
                        <Popconfirm title="Cancel writing the message?"
                            okText="Yes"
                            cancelText="No"
                            onConfirm={handleCancelBtn}
                        >
                            <Button type="default">Cancel</Button>
                        </Popconfirm>
                        <Popconfirm title="Save now and publish later?"
                            okText="Yes"
                            cancelText="No"
                            onConfirm={handlePostAndSaveBtns}
                        >
                            <Button type="default" id='save'>Save</Button>
                        </Popconfirm>
                        <Button type="primary" id='post' onClick={handlePostAndSaveBtns}>Post</Button>
                    </div>
                    {messageId && <Popconfirm title="Delete the Message?"
                        okText="Yes"
                        cancelText="No"
                        onConfirm={handleDeleteBtn}
                    >
                        <Button danger type="default">Delete</Button>
                    </Popconfirm>
                    }
                </div>
            </form>
            <ModalPopup
                title="Continue Where You Left Off?"
                visible={draftContinueModalVisible}
                handleOk={handleContinueBtnOnModal}
                handleCancel={handleCancelBtnOnModal}
                type="info"
                disableScreenTouch={true}
                footerButton="Continue"
                centered={true}
                width={500}
            >
                <p>You have an unfinished draft. Would you like to continue working on it?</p>
            </ModalPopup>
        </>
    )
}

const options = [
    {
        label: 'Notification',
        value: 'NOTIFICATION',
    },
    {
        label: 'Blog',
        value: 'BLOG',
    },
];
