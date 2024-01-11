import React, { useCallback, useState, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import TimeLabel from './TimeLabel';
import Highlighter from 'react-highlight-words';
import { Avatar, Card, Image, Row } from "antd";
import { EngageActionButton, ReportItem, checkAssociatedWithID } from "../utils";
import { useEngageAction } from "../../providers/EngageActionContextProvider";
import { ActiveChatRoomContext } from "../../providers/ActiveChatRoomContextProvider";

// TODO: Change to redux query
function requestImageAttachment(messageID, setter, errorEvent, access) {
    fetch(
        `/api/chat/message_centre/${messageID}/img/`,
        { headers: { Authorization: `Bearer ${access}` } }
    ).then(res => res.blob()).then(data => {
        errorEvent.target.src = URL.createObjectURL(data);
        if (setter) {
            setter(URL.createObjectURL(data));
        }
    });
}

function createImageAttachment(messageID, handleLoadImageCallback, imageState) {
    return (
        <Image
            src={`/api/chat/message_centre/${messageID}/img/`}
            alt={"the attachment for this message response"}
            onError={handleLoadImageCallback}
            preview={{ src: imageState }}
            style={{ width: '100%', height: 'auto' }}
        />
    );
}

export default function ChatRoomMessageCard({ messageData, currentUsername, getWebSocket, researchTeamMentions }) {
    const {
        message_id: messageID,
        display_name: displayName,
        sender,
        content,
        created_at: createdAt,
        profile_type: profileType,
        previousMessage,
        users_that_liked_message_count: usersThatLikedMessageCount,
        is_pinned: isPinned,
        parent_message: parentMessage,
        has_image_attachment: hasImageAttachment,
        displayed_pronouns: displayedPronouns
    } = messageData;

    const { activeChatRoomContext } = useContext(ActiveChatRoomContext);

    const [imageAttachment, setImageAttachment] = useState(null);
    const [parentImageAttachment, setParentImageAttachment] = useState(null);
    // state for report box
    const { actionState } = useEngageAction();

    const handleMessageDeleteButtonClick = useCallback(function (clickEvent) {
        // send the request to the web socket consumer to delete a message
        const deletedMessageID = clickEvent.currentTarget.getAttribute('data-message-id');
        getWebSocket().send(JSON.stringify({
            paradigm: 'delete',
            sender: currentUsername,
            deletedMessageID: deletedMessageID
        }));
    });

    const handleMessageLikeButtonClick = useCallback(function (clickEvent) {
        // send the request to the web socket consumer to delete a message
        const likedMessageID = clickEvent.currentTarget.getAttribute('data-message-id');
        getWebSocket().send(JSON.stringify({
            paradigm: 'like',
            sender: currentUsername,
            likedMessageID: likedMessageID
        }));
    });

    const handleMessagePinButtonClick = useCallback(function (clickEvent) {
        // send the request to the web socket consumer to delete a message
        const pinnedMessageID = clickEvent.currentTarget.getAttribute('data-message-id');
        getWebSocket().send(JSON.stringify({
            paradigm: 'pin',
            sender: currentUsername,
            pinnedMessageID: pinnedMessageID
        }));
    });

    const handleMessageReplyButtonClick = useCallback(function (clickEvent) {
        // set the value of the hidden chat-room-parent-message-input
        const parentMessageID = clickEvent.currentTarget.getAttribute('data-message-id');
        const hiddenParentInput = document.getElementById('chat-room-parent-message-input');
        hiddenParentInput.value = parentMessageID;

        // Show the parent message that the user is responding to by displaying the reply chip with this current users info
        const messageReplyChip = document.getElementById('chat-room-message-reply-chip');
        if (messageReplyChip.classList.contains('hidden')) {
            messageReplyChip.classList.remove('hidden');
        }
        const usernameReplyingTo = clickEvent.currentTarget.getAttribute('data-username-replying-to');
        const displayNameReplyingTo = clickEvent.currentTarget.getAttribute('data-user-replying-to');
        messageReplyChip.querySelector('img').src = `/app/profile/${usernameReplyingTo}/image`;
        messageReplyChip.querySelector('p').textContent = `Replying to: ${displayNameReplyingTo}`;

    });

    const handleLoadImage = useCallback(function (errorEvent) {
        const access = sessionStorage.getItem("access");
        requestImageAttachment(messageID, setImageAttachment, errorEvent, access);
    }, [messageID]);

    const handleLoadParentImage = useCallback(function (errorEvent) {
        const access = sessionStorage.getItem("access");
        requestImageAttachment(parentMessage?.message_id, setParentImageAttachment(), errorEvent, access);
    }, [parentMessage]);

    const deleteMessageButton = (sender === currentUsername)
        ? (
            <button
                className={'chat-room-message-delete-button chat-room-message-action'}
                onClick={handleMessageDeleteButtonClick}
                data-message-id={messageID}
                style={{ ...messageCardStyles.deleteButton, ...messageCardStyles.actionButton }}
            >
                <FontAwesomeIcon icon={solid('trash')} style={messageCardStyles.buttonIcon} />
            </button>
        )
        : null;

    const likeMessageButton = (sender !== currentUsername)
        ? (
            <button
                className={'chat-room-message-like-button chat-room-message-action'}
                onClick={handleMessageLikeButtonClick}
                data-message-id={messageID}
                style={{ ...messageCardStyles.likeButton, ...messageCardStyles.actionButton }}
            >
                <FontAwesomeIcon icon={solid('thumbs-up')} style={messageCardStyles.buttonIcon} />
            </button>
        )
        : null;

    // Since any user can pin any message (including their own) we can just create and return the pin message button
    const pinMessageButton = (
        <button
            className={'chat-room-message-pin-button chat-room-message-action'} onClick={handleMessagePinButtonClick}
            data-message-id={messageID}
            style={{ ...messageCardStyles.pinButton, ...messageCardStyles.actionButton }}
        >
            <FontAwesomeIcon icon={solid('thumbtack')} style={messageCardStyles.buttonIcon} />
        </button>
    );

    const replyMessageButton = (sender !== currentUsername)
        ? (
            <button
                className={'chat-room-message-reply-button chat-room-message-action'}
                onClick={handleMessageReplyButtonClick}
                data-message-id={messageID}
                data-user-replying-to={displayName}
                data-username-replying-to={sender}
                style={{ ...messageCardStyles.replyButton, ...messageCardStyles.actionButton }}
            >
                <FontAwesomeIcon icon={solid('reply')} style={messageCardStyles.buttonIcon} />
            </button>
        )
        : null;

    const reportMessageButton = (sender !== currentUsername)
        ? (
            <div
                className={`chat-room-message-report-button chat-room-message-action ${
                    checkAssociatedWithID(actionState.associatedWithID, "MESSAGE", messageID) ? 'hovered-show-actions' : ''
                }`}
                data-message-id={messageID}
                style={{ ...messageCardStyles.reportButton, ...messageCardStyles.actionButton }}
                key={messageID}
            >
                <EngageActionButton
                    isActionIconFilled={false}
                    isUseInPopover={false}
                    engageActionStyle={messageCardStyles.engageActionStyle}
                    itemID={messageID}
                    type={"MESSAGE"}
                    position="leftTop"
                    actionComponent={
                        <ReportItem
                            reportData={{ id: messageID, type: "MESSAGE" }}
                        />
                    }
                />
            </div>
        )
        : null;

    const pronouns = displayedPronouns?.length > 0 ? `(${displayedPronouns.join(' ,')})` : '';
    // render the message header only if the previous message had a different sender
    const messageHeader = (previousMessage && previousMessage.sender === sender)
        ? null
        : (
            <div className={'chat-room-user-group'} style={messageCardStyles.userGroup}>
                <p className="chat-room-message-card-subtitle" style={messageCardStyles.subtitle}>
                    {displayName}{pronouns}
                    <br />
                    {profileType?.charAt(0).toLocaleUpperCase() + profileType?.toLocaleLowerCase().slice(1)}
                </p>
                <Avatar src={`/app/profile/${sender}/image`} alt={`The profile picture of ${displayName}`}
                    className={"chat-room-message-card-profile-pic"} size={'large'}
                    style={messageCardStyles.avatar}
                />
            </div>
        );

    const likeCountElement = (usersThatLikedMessageCount > 0)
        ? (
            <div className={'message-card-likes'} style={messageCardStyles.userLikesLabel}>
                <FontAwesomeIcon icon={solid('thumbs-up')} />
                {(usersThatLikedMessageCount > 1) ? usersThatLikedMessageCount : ''}
            </div>
        )
        : null;

    // TODO: optimize using recursion to build a parent message card
    const parentMessageImage = (parentMessage?.has_image_attachment)
        ? createImageAttachment(parentMessage.message_id, handleLoadParentImage, parentImageAttachment)
        : null;

    const parentMessageCard = (parentMessage)
        ? (
            <div className={'chat-room-message-parent-message'} style={messageCardStyles.parentMessageCard.container}>
                {parentMessageImage}
                <p style={messageCardStyles.parentMessageCard.name}>{parentMessage.display_name}</p>
                <p style={messageCardStyles.parentMessageCard.content}>
                    <Highlighter searchWords={researchTeamMentions} textToHighlight={parentMessage.content}
                        highlightStyle={messageCardStyles.highlightedText}
                    />
                </p>
            </div>
        )
        : null;

    const imageAttachmentHeader = (hasImageAttachment)
        ? createImageAttachment(messageID, handleLoadImage, imageAttachment)
        : null;

    const displayedChatRoomMessageCard = (
        <Card className={'chat-room-message-card'} style={messageCardStyles.container}>
            {parentMessageCard}
            {imageAttachmentHeader}
            <p className={'chat-room-message-content'} style={messageCardStyles.content}>
                <Highlighter searchWords={researchTeamMentions} textToHighlight={content}
                    highlightStyle={messageCardStyles.highlightedText}
                />
            </p>
            <p className="chat-room-message-time-label" style={messageCardStyles.timeLabel}>{createdAt}</p>
            {likeCountElement}
        </Card>
    );

    // determine if this is the current users message or another users message
    const messageNodeClassName = (sender === currentUsername) ? 'right-aligned' : 'left-aligned';

    return (
        <>
            <TimeLabel
                previousMessageDate={new Date(previousMessage?.created_at)} currentMessageDate={new Date(createdAt)}
            />
            <div className={`chat-room-message-row ${(isPinned) ? 'is-pinned' : ''}`}
                data-message-id={messageID} key={`message-${messageID}`}
                style={messageCardStyles.row}
            >
                <div
                    className={`chat-room-message-node ${messageNodeClassName}`}
                    style={messageCardStyles.messageNode}
                >
                    {messageHeader}
                    <div 
                        className={`chat-room-message-group ${
                            checkAssociatedWithID(actionState.associatedWithID, "MESSAGE", messageID) ? 'hovered-show-actions' : ''
                        }`}
                    >
                        {displayedChatRoomMessageCard}
                        {!activeChatRoomContext.discussionBoard?.is_project_archived && (
                            <div className="chat-room-message-button-container" style={messageCardStyles.buttonContainer}>
                                {likeMessageButton}
                                {deleteMessageButton}
                                {pinMessageButton}
                                {replyMessageButton}
                                {reportMessageButton}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

const messageCardStyles = {
    row: {
        width: '100%'
    },
    messageNode: {
        position: 'relative',
        padding: '0.4em'
    },
    container: {
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        width: '364px',
        margin: '0.2em 1em 0.2em inherit',
        position: 'relative',
        borderRadius: '5px',
        padding: '0.3em',
        boxShadow: '0px 1px 2px 0px #00000040'
    },
    parentMessageCard: {
        container: {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.25)',
            background: '#FFFFFF',
            borderTopRightRadius: '5px',
            borderBottomRightRadius: '5px',
            borderLeft: '7px solid #002E6D',
            outlineOffset: '7px'
        },
        name: {
            fontSize: '9px',
            color: '#002E6D',
            marginLeft: '7px',
            marginBottom: 0,
            marginTop: '9px'
        },
        content: {
            fontSize: '11px',
            marginLeft: '7px',
            paddingBottom: '0.8em'
        }
    },
    userGroup: {
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        padding: '0.3em',
    },
    avatar: {
        width: '30px',
        height: '30px'
    },
    subtitle: {
        marginBottom: 0,
        fontWeight: 'bold',
        textTransform: 'capitalize',
        lineHeight: '12px'
    },
    content: {
        fontSize: '15px',
        color: '#000000',
        marginBottom: '15px',
        wordBreak: 'break-word'
    },
    timeLabel: {
        fontSize: '10px',
        color: "#000000",
        opacity: "60%",
        position: 'absolute',
        bottom: 0,
        right: '10px',
    },
    buttonContainer: {
        display: 'flex',
        flexFlow: 'row nowrap',
        backgroundColor: 'rgba(0, 0, 0, 0.58)',
        width: 'fit-content',
        borderRadius: '5px',
        marginTop: '0.5em'
    },
    actionButton: {
        height: '18px',
        width: '21px',
        borderRadius: '5px',
        border: 'none',
        textAlign: 'center',
        paddingBottom: '1.6em',
    },
    deleteButton: {},
    buttonIcon: {
        fontSize: '8px'
    },
    likeButton: {},
    pinButton: {},
    replyButton: {},
    reportButton: {},
    userLikesLabel: {
        backgroundColor: '#D9D9D9',
        borderRadius: '10px',
        color: '#002E6D',
        fontSize: '8px',
        fontWeight: '600',
        width: 'fit-content',
        padding: '0.4em'
    },
    highlightedText: {
        color: '#2F85FF',
        backgroundColor: 'transparent'
    },
    engageActionStyle: {
        componentContainer: {
            right: '0px',
            top: '-13px',
            left: '40px',
            width: 'max-content',
        },
        reportIconStyle: {
            fontSize: '0.6rem',
        },
    }
};
