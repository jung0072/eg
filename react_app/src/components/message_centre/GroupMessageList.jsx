import React, { useCallback, useContext, useEffect, useState } from "react";
import { Avatar, Card, List, Empty } from "antd";
import { ProjectOutlined, UnorderedListOutlined } from "@ant-design/icons";
import "./group_message_list.css";
import {
    MESSAGE_LIST_TYPES,
    MessageListTypeContext,
    useMessageListTypeContext
} from "../../providers/MessageListTypeContextProvider";
import { ActiveChatRoomContext } from "../../providers/ActiveChatRoomContextProvider";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { useQuery } from "../utils";
import { MessageFilled } from "@ant-design/icons";


export const MESSAGE_CENTRE_ATTACHMENT_TYPES = {
    image: {
        name: 'image',
        icon:
            <FontAwesomeIcon
                icon={solid('image')}
                style={
                    {
                        color: '#000000',
                        opacity: '60%',
                        marginRight: '1em',
                        width: '14px',
                        height: '10.5px'
                    }
                }
            />
    },
};

const groupMessageListStyles = {
    headerButtonContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: 0,
    },
    headerButton: {
        width: '50%',
        height: '60px',
        fontSize: '21px',
        borderTop: 'none',
        borderRight: 'none',
        borderLeft: 'none',
        cursor: 'pointer'
    },
};


export default function GroupMessageList({ researchProjectBoards, taskBoards }) {
    // determine the type of message list to display (projects or tasks)
    const messageListType = useMessageListTypeContext().messageListTypeContext.type;
    let displayedDiscussionBoards = (messageListType.label === MESSAGE_LIST_TYPES.PROJECT.label)
        ? researchProjectBoards
        : taskBoards;
    const { setMessageListTypeContext } = useContext(MessageListTypeContext);
    const {
        researchProjectID,
        chatRoomID,
        discussionBoard,
        setActiveChatRoomContext
    } = useContext(ActiveChatRoomContext);

    const queryParams = useQuery();
    const chatRoomCodeQuery = queryParams.get("discussion");

    const handleClickMessageGroupType = useCallback((clickEvt => {
        const clickedItemID = clickEvt.currentTarget.id;
        switch (clickedItemID) {
            case 'select-project-group-message-list':
                setMessageListTypeContext({ type: MESSAGE_LIST_TYPES.PROJECT });
                break;
            case 'select-tasks-group-message-list':
                setMessageListTypeContext({ type: MESSAGE_LIST_TYPES.TASK });
                break;
            default:
                console.error('this is not a valid message list type');
                break;
        }
    }));

    // use effect hook with empty function to re-render the component whenever the messageListType changes
    useEffect(() => {
    }, [messageListType]);

    // useEffect hook that should only run when the query parameter changes (when the user loads a new view)
    useEffect(() => {
        // if we don't have an active discussion board then lets set the context to show one if it is supplied
        // as a query parameter
        if (!researchProjectID && !chatRoomID && !discussionBoard && researchProjectBoards && chatRoomCodeQuery) {
            // first find the corresponding discussion board data based on the chat room code
            let initialDiscussionBoardGroupIndex = researchProjectBoards.findIndex(board => board.chat_room_code === chatRoomCodeQuery);
            let discussionBoardArray = researchProjectBoards;
            let messageListType = MESSAGE_LIST_TYPES.PROJECT;
            // if we cant find it in the project boards, then check the task boards
            if (initialDiscussionBoardGroupIndex === -1) {
                initialDiscussionBoardGroupIndex = taskBoards.findIndex(board => board.chat_room_code === chatRoomCodeQuery);
                discussionBoardArray = taskBoards;
                messageListType = MESSAGE_LIST_TYPES.TASK;
            }

            // if we found the discussion board, set the active context to show the discussion board
            if (initialDiscussionBoardGroupIndex > -1) {
                setActiveChatRoomContext({
                    chatRoomID: discussionBoardArray[initialDiscussionBoardGroupIndex].chat_room_code,
                    discussionBoard: discussionBoardArray[initialDiscussionBoardGroupIndex],
                    researchProjectID: discussionBoardArray[initialDiscussionBoardGroupIndex]?.linked_study_id
                });
                setMessageListTypeContext({ type: messageListType });
            }
        }
    }, [chatRoomCodeQuery]);

    const groupMessageHeader = (
        <div className={'group-message-list-header'} style={groupMessageListStyles.headerButtonContainer}>
            <button style={groupMessageListStyles.headerButton} id={'select-project-group-message-list'}
                    className={`${(messageListType === MESSAGE_LIST_TYPES.PROJECT) ? 'selected' : ''}`}
                    onClick={handleClickMessageGroupType}
            >
                <ProjectOutlined/>{MESSAGE_LIST_TYPES.PROJECT.label}
            </button>
            <button style={groupMessageListStyles.headerButton} id={'select-tasks-group-message-list'}
                    onClick={handleClickMessageGroupType}
                    className={`${(messageListType === MESSAGE_LIST_TYPES.TASK) ? 'selected' : ''}`}
            >
                <UnorderedListOutlined/>{MESSAGE_LIST_TYPES.TASK.label}
            </button>
        </div>
    );

    // render the message-list
    return (
        <div>
            {groupMessageHeader}

            <div className={'message-centre-message-list'} style={{height: "100vh", overflowY:"auto"}}>
                <List
                    dataSource={displayedDiscussionBoards}
                    footer={<div style={{ marginBottom: "2.5em" }}/>}
                    renderItem={item => (<GroupMessageCard discussionBoard={item}/>)}
                    className={'ant-message-list-header'}
                    locale={{ emptyText: <Empty description={'No active threads'} /> }}
                />
            </div>
        </div>
    );
}

const groupMessageCardStyles = {
    container: {
        backgroundColor: 'inherit',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
        gridTemplateRows: '1fr',
        gridTemplateAreas: `'avatar content content content content'`,
        padding: 0,
        userSelect: 'none',
        cursor: 'pointer'
    },
    groupMessageCard: {
        avatarContainer: {
            gridArea: 'avatar',
            display: 'flex',
            justifyContent: 'center',
            width: "57px",
            height: "57px",
            marginLeft: '1em',
            marginTop: '5px',
        },
        avatar: {
            width: "57px",
            height: "57px",
            textAlign: 'center'
        },
        icon: {
            fontSize: '30px',
            textAlign: 'center'
        },
        content: {
            gridArea: 'content',
            padding: 0,
            // lineHeight: '42px'
        },
        contentRow: {
            display: 'flex',
            flexFlow: 'row nowrap',
            textAlign: 'center',
            marginLeft: '0.5em'
        },
        title: {
            color: '#002E6D',
            fontSize: '16px',
            margin: 0
        },
        lastMessage: {
            fontSize: '12px',
            color: "#000000",
            opacity: "60%",
            marginBottom: 0,
        },
        time: {
            marginLeft: 'auto',
            marginRight: '1em',
            marginTop: '1em',
            fontSize: '10px',
            color: "#000000",
            opacity: "60%"
        },
        unreadMessageLabel: {
            marginLeft: 'auto',
            marginRight: '2em',
            borderRadius: '50%',
            minWidth: '18px',
            minHeight: '18px',
            maxWidth: '18px',
            maxHeight: '18px',
            textAlign: 'center',
            backgroundColor: '#002E6D',
            color: "#FFFFFF",
            fontSize: '10px',
        },
    },

};

function GroupMessageCard({ discussionBoard }) {
    // TODO: Connect the message centre to its own websocket connection to update the unread message count
    const {
        title: dbName,
        last_message: lastMessage,
        unread_message_count: initialUnreadMessageCount,
        id: discussionBoardID,
        chat_room_code: chatRoomID,
        updated_at: discussionBoardUpdateTime,
        linked_study_id: linkedStudyID
    } = discussionBoard;
    const lastUpdateTime = (lastMessage)
        ? new Date(lastMessage.created_at)
        : new Date(discussionBoardUpdateTime);

    // set the unread message count and state variables to control it
    // TODO: update these unread message count numbers with the websocket connections (future), for alpha it will not update after loading in
    const [unreadMessageCount, setUnreadMessageCount] = useState(initialUnreadMessageCount);
    const { setActiveChatRoomContext, activeChatRoomContext } = useContext(ActiveChatRoomContext);

    // callback event to set the active chat room to this chat room id
    const handleGroupMessageCardClick = useCallback(
        (clickEvent) => {
            clickEvent.preventDefault();
            if (!activeChatRoomContext || chatRoomID !== activeChatRoomContext?.chatRoomID) {
                setActiveChatRoomContext({
                    chatRoomID: chatRoomID,
                    discussionBoard: discussionBoard,
                    researchProjectID: linkedStudyID
                });
            }
        },
        // rerender this function if the chat room id changes
        [chatRoomID, activeChatRoomContext]
    );

    // Check if we have a last message and if the following text is greater than its allowed length
    // if it is, append a set of ellipses
    const lastMessageText = (lastMessage)
        ? (lastMessage.content.length > 20)
            ? lastMessage.content.substring(0, 20) + '...'
            : lastMessage.content
        : 'No messages';
    const groupMessageTitle = (dbName.length > 19) ? dbName.substring(0, 16) + '...' : dbName;

    // Check the attachment type of the message, if it is an image, add the image icon to the last message content row
    const displayedLastMessageContent = (lastMessage?.attachment_type === MESSAGE_CENTRE_ATTACHMENT_TYPES.image.name)
        ? (<>{MESSAGE_CENTRE_ATTACHMENT_TYPES.image.icon}{lastMessageText}</>)
        : (<>{lastMessageText}</>);

    // TODO: Update the value of unread messages or use a context or redux state to control the unread message count
    const unreadMessageLabel = (unreadMessageCount > 0)
        ? (<div style={groupMessageCardStyles.groupMessageCard.unreadMessageLabel}>
            {unreadMessageCount}
        </div>)
        : null;

    return (
        <Card
            bodyStyle={groupMessageCardStyles.container}
            className={`groupMessageCard ${(activeChatRoomContext?.chatRoomID === chatRoomID) ? 'selected' : ''}`}
            onClick={handleGroupMessageCardClick}
            data-chat-room-id={chatRoomID}
            data-discussion-board-data={JSON.stringify(discussionBoard)}
            key={discussionBoardID}
        >
            <div style={groupMessageCardStyles.groupMessageCard.avatarContainer}>
                <Avatar style={groupMessageCardStyles.groupMessageCard.avatar} size={57}
                        icon={<MessageFilled style={groupMessageCardStyles.groupMessageCard.icon}/>}
                />
            </div>
            <div style={groupMessageCardStyles.groupMessageCard.content}>
                <div style={groupMessageCardStyles.groupMessageCard.contentRow}>
                    <p style={groupMessageCardStyles.groupMessageCard.title}>{groupMessageTitle}</p>
                    <p style={groupMessageCardStyles.groupMessageCard.time}>
                        {lastUpdateTime.toLocaleString('en-US', { hour: '2-digit', minute: 'numeric', hour12: true })}
                    </p>
                </div>
                <div style={groupMessageCardStyles.groupMessageCard.contentRow}>
                    <p style={groupMessageCardStyles.groupMessageCard.lastMessage}>{displayedLastMessageContent}</p>
                    {unreadMessageLabel}
                </div>
            </div>
        </Card>
    );
}
