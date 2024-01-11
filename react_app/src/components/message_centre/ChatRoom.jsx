import React, { createRef, useCallback, useContext, useEffect, useState } from "react";
import { Alert, Avatar, Button, Mentions, message, Space, Typography, Upload } from "antd";
import useWebSocket from "react-use-websocket";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./chat_room.css";
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { ActiveChatRoomContext } from "../../providers/ActiveChatRoomContextProvider";
import ChatRoomMessageCard from './ChatRoomMessageCard';
import { useResearchTeamDataQuery } from '../../redux/services/researchProjectAPI';
import { CloseCircleOutlined, ProjectOutlined } from "@ant-design/icons";
import { EngageSpinner, getBase64 } from "../utils";
import ConnectionStatusIcon from "../utils/ConnectionStatusIcon";

const { Text, Paragraph, Title } = Typography;

const chatRoomStyles = {
    inactive: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        fontWeight: 700,
        backgroundColor: '#00000040',
        color: '#FFFFFF'
    },
    container: {
        display: 'flex',
        flexFlow: 'column nowrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%'
    },
    chatWindow: {
        width: '100%',
        height: '60%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '0 1em 0 0',
    },
    notificationOutput: {
        marginRight: 'auto',
        marginLeft: '3em',
        fontWeight: 'bold',
        fontSize: '12px'
    },
    messageLog: {
        width: '100%',
        maxHeight: '550px',
        minHeight: '150px',
        height: 'calc(100vh - 64px - 100px - 28px - 21px - 140px)',
        margin: '0',
        overflowY: 'scroll',
        display: 'flex',
        flexFlow: 'column',
        padding: '2em 0',
    },
    controlGroup: {
        container: {
            width: '100%',
            height: '140px',
            display: 'flex',
            flexFlow: 'row nowrap',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.25)',
            position: 'relative',
        },
        messageInput: {
            width: '85%',
            height: '42px',
            border: '1px solid #CACACA',
            borderRadius: '10px',
            overflow: 'auto',
            marginTop: '1em'
        },
        button: {
            color: '#808080',
            borderRadius: '5px',
            border: '0',
            backgroundColor: 'transparent',
            fontSize: '17px',
        },
        inputChip: {
            position: 'absolute',
            border: '1px solid #F1F1F1',
            borderRadius: '5px',
            backgroundColor: '#1AB759',
            padding: '5px',
            top: '5px',
            left: '5px',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '1em'
        },
        inputAvatar: {
            width: '17px',
            height: '17px',
            borderRadius: '50%'
        },
        inputChipText: {
            fontSize: '12px',
            color: '#FFFFFF',
            fontWeight: 500,
            marginBottom: 0,
            marginLeft: '3px'
        }
    },
    pinnedMessageRow: {
        container: {
            height: 'auto',
            width: '100%',
            textAlign: 'left',
            backgroundColor: '#FCD1161A',
            fontSize: '12px',
            display: 'flex',
            flexFlow: 'row nowrap'
        },
        icon: {
            color: '#E8912D',
            marginLeft: '2em',
            marginTop: "0.5em",
            padding: '0.5em'
        },
        text: {
            padding: '0.5em',
            marginTop: '2px',
            marginBottom: 0
        }
    },
    header: {
        container: {
            width: '100%',
            height: 'auto',
            maxHeight: '100px',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
            padding: '0 0 1.5em 2em',
            marginTop: '2em',
            display: 'flex',
            flexFlow: 'row nowrap'
        },
        avatar: {
            width: "57px",
            height: "57px",
        },
        title: { color: '#002E6D', fontSize: '16px', margin: 0 },
        description: { color: 'rgba(0,0,0,0.6)', fontSize: '12px', margin: 0 },
        info: {
            marginLeft: '2em',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: "100%"
        }
    }
};

const PINNED_MESSAGE_CHOICES = {
    ABOVE: 'above',
    BELOW: 'below',
    DISPLAYED: 'displayed'
};

// only allowed properties from the API are used for the creation of messages, if more fields are added then add here
function bundleMessageData(messageDataFromAPI) {
    const {
        message_id, sender, content, created_at, profile_type, display_name, users_that_liked_message_list,
        users_that_liked_message_count, is_pinned, parent_message, has_image_attachment, users_that_read_message_list,
        displayed_pronouns
    } = messageDataFromAPI;
    return {
        message_id, sender, content, created_at, profile_type, display_name, users_that_liked_message_list,
        users_that_liked_message_count, is_pinned, parent_message, has_image_attachment, users_that_read_message_list,
        displayed_pronouns
    };
}

function PinnedMessageRow({ count }) {
    if (!count || count <= 0) {
        return null;
    }
    return (
        <>
            <FontAwesomeIcon icon={solid('thumbtack')} style={chatRoomStyles.pinnedMessageRow.icon} />
            <p style={chatRoomStyles.pinnedMessageRow.text}>{count} Pinned</p>
        </>
    );
}

// TODO: refactor to using state to reset the chat log
function resetChatLog() {
    const chatLog = document.getElementById('chat-room-message-log');
    if (chatLog) {
        chatLog.innerHTML = '';
    }
}

export default function ChatRoom({ username, currentUserIdentifier }) {
    // context variables to validate the state of the application
    // get the active chat room id and display the information for that room into the chat room
    const { activeChatRoomContext } = useContext(ActiveChatRoomContext);
    // const djangoContext = useDjangoContext();
    const [webSocketURL, setWebSocketURL] = useState(null);
    const [researchProjectID, setResearchProjectID] = useState(null);
    const [isProjectArchived, setIsProjectArchived] = useState(false);
    const [messageHistory, setMessageHistory] = useState([]);

    // state variables to hold the users current actions
    const [messageInputValue, setMessageInputValue] = useState('');
    const [imageURL, setImageURL] = useState(null);
    const [imageFileList, setImageFileList] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [typingTimeoutID, setTypingTimeoutID] = useState(null);
    // messages will be structured as: id (messageID: int), position (choices:['above', 'below', 'displayed']: string)
    const [viewablePinnedMessages, setViewablePinnedMessages] = useState({
        messages: [], pinnedMessagesAboveCount: 0, pinnedMessagesBelowCount: 0
    });
    const chatInputRef = createRef();
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // rerender the component each time the active chat room id changes
    useEffect(() => {
        clearMessageInput();
        setViewablePinnedMessages({
            messages: [], pinnedMessagesAboveCount: 0, pinnedMessagesBelowCount: 0
        });
        setMessageHistory([]);
        if (activeChatRoomContext?.chatRoomID) {
            const protocol = (window.location.protocol === 'https:')
                ? 'wss'
                : 'ws';
            setWebSocketURL(`${protocol}://${process.env.WEBSOCKET_SERVER}/ws/chat/${activeChatRoomContext.chatRoomID}/`);
            setResearchProjectID(activeChatRoomContext.researchProjectID);
            setIsProjectArchived(activeChatRoomContext.discussionBoard?.is_project_archived);
        }
    }, [activeChatRoomContext, setViewablePinnedMessages, setResearchProjectID, setMessageHistory]);

    useEffect(() => {
        const imageInput = document.getElementById('chat-room-image-attachment-input');
        if (imageInput) {
            imageInput.value = (imageURL) ? imageURL : '';
        }
    }, [imageURL]);

    const handleChatRoomScrollEvent = (entries) => {
        entries.forEach(entry => {
            // Save the ID and the position of each message in an object, to calculate the viewable message
            // number we can reduce the array and calculate based of the position of each object
            setViewablePinnedMessages(previous => {
                let pinnedMessagePosition = null;
                let updatedPrevious = { ...previous };
                if (entry.isIntersecting) {
                    // on the screen
                    pinnedMessagePosition = PINNED_MESSAGE_CHOICES.DISPLAYED;
                } else if (entry.boundingClientRect.top > 475) {
                    //above the screen
                    pinnedMessagePosition = PINNED_MESSAGE_CHOICES.BELOW;
                } else if (entry.boundingClientRect.top < 100) {
                    //below the screen
                    pinnedMessagePosition = PINNED_MESSAGE_CHOICES.ABOVE;
                }
                // now if we have a pinnedMessagePosition, update the value of the message and return the updated previous entry
                if (pinnedMessagePosition) {
                    // first find the index of the message id in the message array by parsing the int from the message id
                    const messageID = entry.target.getAttribute('data-message-id');
                    const messageIndex = updatedPrevious.messages.findIndex(msg => msg.id === parseInt(messageID));
                    if (messageIndex > -1) {
                        // update the value of the pinned message
                        updatedPrevious.messages[messageIndex].position = pinnedMessagePosition;
                    } else {
                        // add the value of the pinned message position
                        updatedPrevious.messages.push({
                            id: parseInt(messageID),
                            position: pinnedMessagePosition
                        });
                    }
                }
                // update the total values of the above and below messages:
                updatedPrevious.pinnedMessagesAboveCount = updatedPrevious.messages.reduce((accumulator, msg) =>
                    (msg.position === PINNED_MESSAGE_CHOICES.ABOVE) ? accumulator + 1 : accumulator, 0
                );
                updatedPrevious.pinnedMessagesBelowCount = updatedPrevious.messages.reduce((accumulator, msg) =>
                    (msg.position === PINNED_MESSAGE_CHOICES.BELOW) ? accumulator + 1 : accumulator, 0
                );
                return updatedPrevious;
            });
        });
    };

    // use effect block to set the observer for all the pinned messages
    useEffect(() => {
        const observer = new IntersectionObserver(handleChatRoomScrollEvent, {
            threshold: [0, 0.25, 0.5, 0.75, 1]
        });
        const pinnedMessages = Array.from(document.querySelectorAll('.is-pinned'));
        const pinnedMessageList = messageHistory.filter(msg => msg.is_pinned).map(msg => msg.message_id);
        if (pinnedMessages) {
            pinnedMessages.forEach(messageNode => {
                const pinnedMessageID = parseInt(messageNode.getAttribute('data-message-id'));
                if (pinnedMessageList.includes(pinnedMessageID)) {
                    observer.observe(messageNode);
                } else {
                    observer.unobserve(messageNode);
                }
            });
        }
        return () => observer.disconnect();
    }, [messageHistory, activeChatRoomContext, isLoadingMessages]);

    const handleWebSocketMessageEventReceived = useCallback(async function (messageEvent) {
        // callback listener for when the chatSocket receives a message from the server
        // get the message content from the messageEvent
        const messageContent = JSON.parse(messageEvent.data);
        const { paradigm, sender } = messageContent;
        if (paradigm === 'message') {
            // whenever we receive a new message, bundle all the data into the messageData variable and then
            // add it to the array.
            const messageData = bundleMessageData(messageContent);
            const updatedMessageArray = [...messageHistory, messageData];
            setMessageHistory(updatedMessageArray);
            const messageLog = document.getElementById('chat-room-message-log');
            if (messageLog) {
                messageLog.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }

            // if the user has this chat room open when they receive the message then we can automatically mark as read
            getWebSocket().send(JSON.stringify({
                paradigm: 'read',
                sender: username,
                readMessageList: [messageData.message_id]
            }));
        } else if (paradigm === 'typing') {
            // the user is typing or not typing code switch
            const { is_typing } = messageContent;
            setUserIsTypingText(sender, is_typing);
        } else if (paradigm === 'delete') {
            // delete a message if the event was received and the status was 'success'
            const { status, deleted_message_id } = messageContent;
            if (status === 'success') {
                // delete the message by filtering the array and removing any items that match the deleted_message_id
                setMessageHistory(current => current.filter(msg => msg.message_id !== parseInt(deleted_message_id)));
            }
        } else if (paradigm === 'like') {
            const { status, liked_message_id, sender_id, action } = messageContent;
            const likedMessageIndex = messageHistory.findIndex(item => item.message_id === parseInt(liked_message_id));
            if (status === 'success') {
                const updatedMessageHistory = [...messageHistory];
                const updatedMessage = updatedMessageHistory[likedMessageIndex];
                if (action === "like") {
                    updatedMessage.users_that_liked_message_list.push(sender_id);
                    updatedMessage.users_that_liked_message_count += 1;
                } else if (action === "dislike") {
                    updatedMessage.users_that_liked_message_list = updatedMessage.users_that_liked_message_list.filter(
                        id => parseInt(id) !== parseInt(sender_id)
                    );
                    updatedMessage.users_that_liked_message_count -= 1;
                }
                updatedMessageHistory[likedMessageIndex] = updatedMessage;
                setMessageHistory(updatedMessageHistory);
            }
        } else if (paradigm === "pin") {
            // If the pin event is received then find the index of the pinned message and then reverse the state of it
            // if it pinned or not
            const { status, pinned_message_id } = messageContent;
            const pinnedMessageIndex = messageHistory.findIndex(item => item.message_id === parseInt(pinned_message_id));
            if (status === 'success') {
                const updatedMessageHistory = [...messageHistory];
                updatedMessageHistory[pinnedMessageIndex] = {
                    ...updatedMessageHistory[pinnedMessageIndex],
                    is_pinned: !updatedMessageHistory[pinnedMessageIndex].is_pinned
                };
                setMessageHistory(updatedMessageHistory);
            }
        } else if (paradigm === "read") {
            // If we get a read message list and the status is success, iterate over the message history
            // and update the read message list to contain the new user id who read them
            const { status, read_message_list: readMessageList, sender_id } = messageContent;
            const containsReadMessage = (item) => readMessageList.includes(item);
            if (status === "success") {
                setMessageHistory(previous => [...previous].map((msg) => {
                    // if the messages users that read message list does not contain the sender id, add it in
                    if (!msg.users_that_read_message_list.some(containsReadMessage)) {
                        msg.users_that_read_message_list.push(sender_id);
                    }
                    return msg;
                }));
            }
        } else {
            console.warn("Chat Application WebSocket has encountered an unrecognized paradigm:", paradigm);
        }
    });

    // create the websocket and establish the connection, you will have access to a getWebsocket function that will
    // return the webSocket and allow you to publish events. This method also has access to the following (from React websocket docs)
    // sendMessage, sendJsonMessage, lastMessage, lastJsonMessage, readyState
    const {
        getWebSocket,
        readyState
    } = useWebSocket(
        webSocketURL,
        {
            onOpen: async function () {
                // callback to wait for the websocket to be in the ready state, load all previous messages when ready
                setIsLoadingMessages(true);
                const messageRequest = new Request(
                    `/chat/research_project/${activeChatRoomContext.chatRoomID}/messages/`,
                    {
                        headers: new Headers({
                            'Content-Type': 'application/json'
                        })
                    }
                );
                fetch(messageRequest)
                    .then(response => response.json())
                    .then(({ previous_messages }) => {
                        if (previous_messages) {
                            resetChatLog();
                            const previousMessageDataArray = previous_messages.map(msg => bundleMessageData(msg));
                            setMessageHistory(previousMessageDataArray);
                        }
                        setIsLoadingMessages(false);
                    })
                    .catch((error) => console.error('System error when requesting previous messages', error));
            },
            onMessage: handleWebSocketMessageEventReceived,
            onClose: async (socketEvent) => console.error('Engage Chat App Web Socket closed unexpectedly', socketEvent),
            shouldReconnect: (closeEvent) => (webSocketURL !== null)
        });

    // function to clear any text inside the messaging input
    const clearMessageInput = useCallback(function () {
        setMessageInputValue('');
        setImageURL('');
        setImageFileList([]);
        const parentMessageInput = document.getElementById('chat-room-parent-message-input');
        const imageAttachmentInput = document.getElementById('chat-room-image-attachment-input');
        const messageReplyChip = document.getElementById('chat-room-message-reply-chip');
        if (chatInputRef.current) {
            chatInputRef.current.value = '';
        }
        if (parentMessageInput) {
            parentMessageInput.value = '';
        }
        if (imageAttachmentInput) {
            imageAttachmentInput.value = '';
        }
        if (messageReplyChip) {
            if (!messageReplyChip.classList.contains('hidden')) {
                messageReplyChip.classList.add('hidden');
            }
        }
    }, [setMessageInputValue, setImageURL, setImageFileList]);

    // function to set the current typing status of a user ,will respond to websocket events
    const setUserIsTypingText = (senderUsername, isTypingStatus) => {
        // first get a reference to the chat log output
        const chatLogNotificationOutput = document.getElementById('chat-room-notification-output');

        // if the user is typing, check if it is the same user or another user
        // otherwise if no one is typing then remove the content and typing class
        if (isTypingStatus) {
            const userCurrentlyTyping = chatLogNotificationOutput.getAttribute('data-sender');
            if (userCurrentlyTyping !== senderUsername && userCurrentlyTyping !== '' && userCurrentlyTyping) {
                chatLogNotificationOutput.textContent = `Multiple users are typing`;
            } else {
                chatLogNotificationOutput.textContent = `${senderUsername} is typing`;
                chatLogNotificationOutput.setAttribute('data-sender', senderUsername);
            }
        } else {
            chatLogNotificationOutput.textContent = '';
            chatLogNotificationOutput.className = '';
        }
    };

    // callback function to use a state variable to get the output of the message input
    const handleInputOnChange = (messageInputText) => setMessageInputValue(messageInputText);

    // callback function to submit a message to the chat
    const handleClickSubmitMessage = () => {
        // only send the message if there is content
        if (messageInputValue.trim() !== '') {
            // check if this is a reply to a message by checking the parent message input
            const parentMessageValue = document.getElementById('chat-room-parent-message-input').value;
            const parentMessageID = (parentMessageValue.trim() !== '') ? parentMessageValue : '';
            const imageAttachment = document.getElementById('chat-room-image-attachment-input').value;

            // send the event through the websocket
            getWebSocket().send(JSON.stringify({
                paradigm: 'message',
                message: messageInputValue,
                parentMessageID: parentMessageID,
                sender: username,
                imageAttachment: imageAttachment
            }));
            clearMessageInput();
        }
    };

    // callback function to send the current users typing status to the websocket
    const sendWebSocketTypingStatus = useCallback(function (isTypingOverride) {
        getWebSocket().send(JSON.stringify({
            paradigm: 'typing',
            sender: username,
            isTyping: (isTypingOverride) ? isTypingOverride : isTyping
        }));
    });

    // TODO: currently we will read all messages that are sent, and any message that is received is ignored, need to find workaround
    const handleSendUserReadMessageList = useCallback(function () {
        // first get all the messages that the user has not read from the message history
        const unreadMessageList = messageHistory.filter(
            msg => !msg.users_that_read_message_list.includes(currentUserIdentifier)
        ).map(({ message_id: messageID }) => messageID);
        // finally send the websocket event with the list of message ids
        getWebSocket().send(JSON.stringify({
            paradigm: 'read',
            sender: username,
            readMessageList: unreadMessageList
        }));
    });

    // callback function to show the user is not typing anymore, this will be called by a specific timeout
    const handleSendUserIsNotTyping = useCallback(function () {
        sendWebSocketTypingStatus(false);
        document.getElementById('chat-room-notification-output').setAttribute('data-sender', '');
    });


    // callback events for the keyboard shortcuts when using the message centre
    const handleMessageInputKeyDown = useCallback(function (keyDownEvt) {
        // first check if there are is already a typing timeout and clear that from the app
        if (typingTimeoutID) {
            clearInterval(typingTimeoutID);
        }

        // after 750ms of no input, send a stopped typing event
        sendWebSocketTypingStatus(true);
        setTypingTimeoutID(setTimeout(handleSendUserIsNotTyping, 750));

        // handle specific keys
        switch (keyDownEvt.keyCode) {
            case 13:
                // enter button, send the message
                document.getElementById('chat-room-send-button').click();
                break;
            case 27:
                // escape key, clear the input
                clearMessageInput();
                break;
            default:
                return;
        }
    });

    // callback function to cancel replying to a message and deleting all the values set
    const handleCancelReplyMessageClick = useCallback((clickEvent) => {
        // clear out the values for the replied message input
        document.getElementById('chat-room-parent-message-input').value = null;
        const messageReplyChip = document.getElementById('chat-room-message-reply-chip');
        if (!messageReplyChip.classList.contains('hidden')) {
            messageReplyChip.classList.add('hidden');
        }
        messageReplyChip.querySelector('img').src = '#';
        messageReplyChip.querySelector('p').textContent = '';
    });

    // Query the data from the research project, so we can display the names of the team members in the header:
    // Only fetch researchProjectTeamData when the user selected a chat room
    const {
        data: researchProjectTeamData,
        isLoading: isLoadingResearchTeam
    } = useResearchTeamDataQuery(researchProjectID, {
        skip: !researchProjectID
    });
    if (!webSocketURL || !researchProjectID) {
        return (
            <div style={chatRoomStyles.inactive}>
                Select a Project or Task Discussion to begin communicating.
            </div>
        );
    }

    // Get the research team descriptions and team members list to support includes in the message centre application
    const researchTeamDescription = (isLoadingResearchTeam)
        ? (<p style={chatRoomStyles.header.description}>Team Members: Loading Research Team...</p>)
        : (<p style={chatRoomStyles.header.description}>Team
                                                        Members: {researchProjectTeamData.data.map(member => member.full_name).join(", ")}</p>);

    const researchTeamMentionsOptions = (isLoadingResearchTeam)
        ? null
        : researchProjectTeamData.data.map(member => ({ value: `${member.full_name}`, label: member.full_name }));

    // function to render the chat room message cards, we will bundle all the messageData into one object while also
    // giving a reference to the current user that is viewing the application as well as the reference to the getWebSocket function
    const renderChatRoomMessageCard = (item, idx, messageArray) => {
        // Render each message into a chat room message card, and if there is a previous message add a reference
        // to the previous message to the item. This will help group messages made by the same user
        item.previousMessage = (idx > 0) ? messageArray[idx - 1] : null;
        return <ChatRoomMessageCard
            messageData={item} currentUsername={username} getWebSocket={getWebSocket}
            researchTeamMentions={researchProjectTeamData?.data.map(member => `@${member.full_name}`)}
            key={item?.message_id}
        />;
    };
    const displayedMessageCards = messageHistory.map(renderChatRoomMessageCard);

    // set up the image upload properties by checking to see if the uploaded image is a file, then convert to base64
    // to get the image ready to upload through the websocket connection
    const imageFileTypes = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'png', 'eps'];

    const uploadImageProps = {
        name: 'message-image-attachment',
        listType: 'text',
        maxCount: 1,
        accept: imageFileTypes.map(type => `.${type}`).toString(),
        fileList: imageFileList,
        beforeUpload: (file) => {
            // check if the file type that was uploaded was an image and if it was not return the ignore event
            const isImageFile = imageFileTypes.map(ext => `image/${ext}`).includes(file.type);
            if (!isImageFile) {
                message.error(`${file.name} is not an image file`);
            }

            // The image must be under 2MB
            const imageFileSizeLimit = file.size / 1024 / 1024 < 2;
            if (!imageFileSizeLimit) {
                message.error(`${file.name} must be smaller then 2MB`);
            }
            return (isImageFile && imageFileSizeLimit) || Upload.LIST_IGNORE;
        },
        onChange: ({ file, fileList }) => {
            // set the image url
            // from ant-d docs about controlling state for the file list
            let newFileList = fileList;
            newFileList = newFileList.map(file => {
                if (file.response) {
                    const updated_file = file;
                    updated_file.url = file.response.url;
                    updated_file.status = "done";
                    updated_file.name = file.name;
                    return updated_file;
                }
                return file;
            });
            setImageFileList(newFileList);
            // initially started from the ant-d upload documentation
            if (file.status === 'done') {
                // get the base64 url from the image and set the loading/ image states
                getBase64(file.originFileObj, (url) => {
                    setImageURL(url);
                });
            }
        },
        onRemove: () => {
            setImageURL(null);
            setImageFileList([]);
        },
        onPreview: () => null,
        customRequest: ({ onSuccess }) => setTimeout(() => onSuccess('ok'), 50),
    };

    const imageUploadButton = (imageURL)
        ? null
        : (
            <Button 
                disabled={isProjectArchived} 
                className="chat-room-attachment-picker" 
                style={chatRoomStyles.controlGroup.button}
                icon={<FontAwesomeIcon icon={solid('paperclip')} />}
            >
            </Button>
        );

    // render the chat room components
    return (
        <>
            {(isLoadingMessages) ? (<EngageSpinner loaderText={"Loading messages..."} />) : null}
            <div className={'chat-room'} style={chatRoomStyles.container}
                onLoad={() => handleSendUserReadMessageList()}
            >
                <div className="chat-room-header" style={chatRoomStyles.header.container}>
                    <Avatar style={chatRoomStyles.header.avatar} size={57}
                        icon={<ProjectOutlined />}
                    />
                    <div className="discussion-board-info" style={chatRoomStyles.header.info}>
                        <div>
                            <Text style={chatRoomStyles.header.title}>
                                {activeChatRoomContext.discussionBoard.title}
                            </Text>
                            <Paragraph row style={chatRoomStyles.header.description}
                                ellipsis={{
                                    rows: 2,
                                    expandable: true,
                                    symbol: 'more',
                                }}
                            >
                                {activeChatRoomContext.discussionBoard.description}
                            </Paragraph>
                            {researchTeamDescription}
                        </div>
                        <ConnectionStatusIcon readyState={readyState} />
                    </div>
                </div>
                <Alert
                    description={"Message in this discussion board can be seen by all team members including direct " +
                    "responses to specific users."}
                    type="info"
                    closable={true}
                    style={{ width: "100%" }}
                    showIcon={true}
                />
                {isProjectArchived && (
                    <Alert
                        description={"At present, this project is in an archived state, preventing any actions or text messages until the status is changed."}
                        type="warning"
                        closable={false}
                        style={{ width: "100%" }}
                        showIcon={true}
                    />
                )}
                <div className="chat-room-pinned-messages above" style={chatRoomStyles.pinnedMessageRow.container}>
                    <PinnedMessageRow count={viewablePinnedMessages.pinnedMessagesAboveCount} />
                </div>
                <div className="chat-room-window" style={chatRoomStyles.chatWindow}>
                    <div className={"chat-room-message-log"} style={chatRoomStyles.messageLog}
                        id={"chat-room-message-log"}
                        onLoad={(evt) => {
                            evt.currentTarget.lastElementChild.scrollIntoView({
                                behavior: 'smooth',
                                block: 'end'
                            });
                            // Will need to modify message history by setting it to its self in order to re-trigger
                            setTimeout(() => setMessageHistory([...messageHistory]), 200);
                        }}
                    >
                        {displayedMessageCards}
                    </div>
                    <div className="chat-room-notification-output" id="chat-room-notification-output"
                        style={chatRoomStyles.notificationOutput}
                    />
                </div>
                <div className="chat-room-pinned-messages below" style={chatRoomStyles.pinnedMessageRow.container}>
                    <PinnedMessageRow count={viewablePinnedMessages.pinnedMessagesBelowCount} />
                </div>
                <div className="chat-room-control-group" style={chatRoomStyles.controlGroup.container}>
                    <Upload {...uploadImageProps}>
                        {imageUploadButton}
                    </Upload>
                    <input type="hidden" name="chat-room-parent-message" id="chat-room-parent-message-input"
                        className={'hidden'}
                    />
                    <input type="hidden" name="chat-room-image-attachment" id="chat-room-image-attachment-input"
                        className={'hidden'}
                    />
                    <div className="chat-room-message-chip hidden" id={'chat-room-message-reply-chip'}
                        style={chatRoomStyles.controlGroup.inputChip}
                    >
                        <img src="" alt="user chip avatar" style={chatRoomStyles.controlGroup.inputAvatar} />
                        <p style={chatRoomStyles.controlGroup.inputChipText} />
                        <Button
                            icon={<CloseCircleOutlined style={{ color: "white" }} />}
                            style={{ backgroundColor: 'transparent', marginLeft: '1em' }}
                            onClick={handleCancelReplyMessageClick}
                            shape={"circle"}
                            type={"text"}
                        />
                    </div>
                    {/*TODO: Enable mentions to send users notification saying they got mentioned */}
                    <Mentions type="text" name="chat-room-message" id="chat-room-input" placeholder={'Type a message'}
                        onChange={handleInputOnChange} onKeyDown={handleMessageInputKeyDown}
                        style={chatRoomStyles.controlGroup.messageInput}
                        options={researchTeamMentionsOptions} ref={chatInputRef}
                        value={messageInputValue}
                        disabled={isProjectArchived}
                    />
                    <Button disabled={isProjectArchived} className="chat-room-send-button" id={'chat-room-send-button'}
                        onClick={handleClickSubmitMessage} style={chatRoomStyles.controlGroup.button}
                        icon={<FontAwesomeIcon icon={solid('paper-plane')} />}
                    >
                    </Button>
                </div>
            </div>
        </>
    );
}
