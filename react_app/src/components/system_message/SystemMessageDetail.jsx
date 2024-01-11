
import React from 'react'
import { useParams } from "react-router-dom";
import { Typography } from "antd";
import { EditorState, convertFromRaw } from 'draft-js';
import { Editor } from "react-draft-wysiwyg";

import { useGetSystemMessageQuery } from "../../redux/services/userAPI"
import { EngageSpinner } from '../utils/engage_spinner/EngageSpinner.jsx'

import '../admin_panel/admin_panel_components/system_message.css'


export default function SystemMessageDetail() {
    const { id: messageId } = useParams();
    const { data: fetchedMessage, error, isLoading, refetch } = useGetSystemMessageQuery(messageId)

    if (isLoading) {
        return <EngageSpinner loaderText={"Loading System Messages"} />;
    }

    const parsedContent = JSON.parse(fetchedMessage.content)
    const convertedContent = convertFromRaw(parsedContent)
    // create editorState with converted content
    const editorState = EditorState.createWithContent(convertedContent)

    return (
        <div className='systemMessageContainer'>
            <Typography.Title level={3}>{fetchedMessage.title}</Typography.Title>
            <Editor toolbarHidden readOnly={true} editorState={editorState} wrapperClassName="wrapperClassName"
                editorClassName="editorClassName" />
        </div>
    )
}
