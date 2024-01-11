const chatRoomApp = {
    chatSocket: null,
    username: '',
    roomCode: null,
    chatLog: null,
    messageBox: null,
    submitMessageBtn: null,
    keyboardTimeoutId: null,
    textFormattingModeList: [],
    init: function (ev) {
        // first get a reference to the code for the chat room and add all the references to the required html nodes
        const roomCodeNode = document.getElementById('chat-room-title');
        this.roomCode = roomCodeNode.getAttribute('data-room-code');
        this.username = roomCodeNode.getAttribute('data-username');
        this.chatLog = document.getElementById('chat-log');
        this.messageBox = document.getElementById('message-content');
        this.submitMessageBtn = document.getElementById('send-message-button');

        // using the chat room code, create a WebSocket Connection and add all the callback listeners
        this.chatSocket = new WebSocket(`ws://${window.location.host}/ws/chat/${this.roomCode}/`);
        this.chatSocket.onopen = this.onWebSocketConnectionOpen.bind(this);
        this.chatSocket.onmessage = this.onWebSocketEventReceived.bind(this);
        this.chatSocket.onclose = this.onWebSocketConnectionClosed;

        // after setting up the websocket connection, add the appropriate event listeners
        this.submitMessageBtn.addEventListener('click', this.handleSendMessage.bind(this));
        this.messageBox.addEventListener('keydown', this.handleMessageInputKeyDown.bind(this));

        // disabled for now, reimplement once a rich text editor is implemented into the chat rooms
        // this.initChatRoomControls();
    },
    initChatRoomControls: function () {
        document.getElementById('bold-text').addEventListener('click', this.setFormattingMode.bind(this));
        document.getElementById('italic-text').addEventListener('click', this.setFormattingMode.bind(this));
        document.getElementById('underline-text').addEventListener('click', this.setFormattingMode.bind(this));
        document.getElementById('strikethrough-text').addEventListener('click', this.setFormattingMode.bind(this));
    },
    setFormattingMode: function (ev) {
        const buttonNode = ev.currentTarget;
        const formattingMode = buttonNode.getAttribute('data-formatting-mode');

        if (buttonNode.classList.contains('selected')) {
            // using the input formatting mode, find the index of the formatting mode and remove it from the list
            const formattingModeIndex = this.textFormattingModeList.findIndex(mode => mode === formattingMode);
            this.textFormattingModeList.splice(formattingModeIndex, 1);
            buttonNode.classList.remove('selected');

        } else {
            // add the selected class and formatting mode
            this.textFormattingModeList.push(formattingMode);
            buttonNode.classList.add('selected');
        }
    },
    onWebSocketConnectionOpen: async function (openEvent) {
        // callback to wait for the websocket to be in the ready state, load all previous messages when ready
        const messageRequest = new Request(
            `/chat/research_project/${this.roomCode}/messages/`,
            {
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            }
        );
        fetch(messageRequest)
            .then(response => response.json())
            .then(({ previous_messages, success, error }) => {
                if (previous_messages) {
                    this.chatLog.innerHTML = '';
                    previous_messages.forEach(({ message_id, sender, content, created_at, profile_type }) => {
                        // this.chatLog.textContent += `${sender} [${created_at}]: ${content}\n`;
                        this.createMessage(message_id, sender, content, created_at, profile_type);
                    });
                }

            })
            .catch(({ error }) => console.error('System error when requesting previous messages', error));
    },
    onWebSocketEventReceived: function (messageEvent) {
        // callback listener for when the chatSocket receives a message from the server
        // get the message content from the messageEvent
        const messageContent = JSON.parse(messageEvent.data);
        const { message_id, paradigm, sender } = messageContent;
        if (paradigm === 'message') {
            const { content, created_at, profile_type } = messageContent;
            this.createMessage(message_id, sender, content, created_at, profile_type);
        } else if (paradigm === 'typing') {
            // the user is typing or not typing code switch
            const { is_typing } = messageContent;
            this.setUserIsTypingText(sender, is_typing);
        } else if (paradigm === 'delete') {
            // delete a message if the event was received and the status was success
            const { status, deleted_message_id } = messageContent;
            if (status === 'success') {
                this.deleteMessageFromChatRoom(deleted_message_id);
            }
        } else {
            console.log(paradigm);
        }
    },
    setUserIsTypingText: function (sender, isTyping) {
        // first get a reference to the chat log output
        const chatLogNotificationOutput = document.getElementById('chat-log-notification-output');

        // if the user is typing, check if it is the same user or another user
        // otherwise if no one is typing then remove the content and typing class
        if (isTyping) {
            const userCurrentlyTyping = chatLogNotificationOutput.getAttribute('data-sender');
            if (userCurrentlyTyping !== sender && userCurrentlyTyping !== '') {
                chatLogNotificationOutput.textContent = `Multiple users are typing`;
            } else {
                chatLogNotificationOutput.textContent = `${sender} is typing`;
                chatLogNotificationOutput.setAttribute('data-sender', sender);
            }
        } else {
            chatLogNotificationOutput.textContent = '';
            chatLogNotificationOutput.className = '';
        }
    },
    // callback listener for when the chatSocket is closed
    onWebSocketConnectionClosed: (socketEvent) => console.error('Chat socket closed unexpectedly', socketEvent),
    handleSendMessage: function (ev) {
        // get the message content from the input and then send it as JSON under a message event
        // then clear out the message input before finishing up
        const messageContent = this.messageBox.value;

        // only send the message if there is content
        if (messageContent.trim() !== '') {
            chatRoomApp.chatSocket.send(JSON.stringify({
                paradigm: 'message',
                message: messageContent,
                sender: chatRoomApp.username
            }));
            this.messageBox.value = '';
        }
    },
    handleSendUserIsNotTyping: function () {
        this.sendWebSocketTypingStatus(false);
        document.getElementById('chat-log-notification-output').setAttribute('data-sender', '');
    },
    sendWebSocketTypingStatus: function (isTyping) {
        chatRoomApp.chatSocket.send(JSON.stringify({
            paradigm: 'typing',
            sender: chatRoomApp.username,
            isTyping: isTyping
        }));
    },
    handleSendDeleteMessageRequest: (clickEvent) => {
        // send the request to the web socket consumer to delete a message
        const deletedMessageID = clickEvent.currentTarget.getAttribute('data-message-id');
        chatRoomApp.chatSocket.send(JSON.stringify({
            paradigm: 'delete',
            sender: chatRoomApp.username,
            deletedMessageID: deletedMessageID
        }));
    },
    deleteMessageFromChatRoom: function (messageID) {
        // delete the specified message from the chat room
        const messageNode = document.querySelector(`.message[data-message-id="${messageID}"]`);
        messageNode.remove();
    },
    createMessage: function (messageId, sender, content, created_at, profile_type) {
        const messageNode = document.createElement('div');
        messageNode.className = 'message';
        // messageNode.textContent = `${sender} [${created_at}]: ${content}\n`;
        messageNode.innerHTML = `
            <img src="/app/profile/${sender}/image/" alt="The profile picture of ${sender}" class="message-profile-pic">
            <p>${sender}</p>
            <p class="sub-title">${profile_type?.charAt(0).toLocaleUpperCase() + profile_type.toLocaleLowerCase().slice(1)}</p>
            <p class="time">${created_at}</p>
            <p class="message-body">${content}</p>
        `;
        // check if the message from someone else or this user, all messages from the user are right aligned
        messageNode.classList.add((sender === chatRoomApp.username) ? 'right-aligned' : 'left-aligned');
        messageNode.setAttribute('data-message-id', messageId);

        // create the delete message button, add it as a child to the message node with the correct events and return
        // to the chat log. Only do this if the username is the same as the sender
        if (sender === chatRoomApp.username) {
            const deleteButtonNode = document.createElement('button');
            deleteButtonNode.className = 'delete-message-btn';
            deleteButtonNode.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButtonNode.addEventListener('click', chatRoomApp.handleSendDeleteMessageRequest);
            deleteButtonNode.setAttribute('data-message-id', messageId);
            messageNode.appendChild(deleteButtonNode);
        }

        this.chatLog.prepend(messageNode);
    },
    handleMessageInputKeyDown: function (ev) {
        // start a timeout to check if the user is finished typing after clearing the current timer
        clearTimeout(this.keyboardTimeoutId);

        // after 5 seconds of no input, send a stopped typing event
        this.sendWebSocketTypingStatus(true);
        this.keyboardTimeoutId = setTimeout(this.handleSendUserIsNotTyping.bind(this), 5000);

        // handle specific keys
        switch (ev.keyCode) {
            case 13:
                this.submitMessageBtn.click();
                break;
            case 17:
                // TODO: add emoji selector
                return;
            case 27:
                // escape key, clear the input
                this.messageBox.value = '';
                break;
            default:
                return;
        }
    },
};

document.addEventListener('DOMContentLoaded', chatRoomApp.init.bind(chatRoomApp));
