import React, { useContext, useState, useEffect } from "react";
import { useMessageCentreDataQuery } from "../redux/services/messageCentreAPI.js";
import GroupMessageList from "../components/message_centre/GroupMessageList";
import ChatRoom from "../components/message_centre/ChatRoom";
import { MessageListTypeContextProvider } from "../providers/MessageListTypeContextProvider";
import { ActiveChatRoomContextProvider } from "../providers/ActiveChatRoomContextProvider";
import { EngageSpinner } from "../components/utils";
import { CaretLeftOutlined, CaretRightOutlined } from "@ant-design/icons";
import { useEngageStylingLayout } from "../providers/EngageLayoutStylingContextProvider.jsx";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { MENU_ROUTES } from "../components/utils/constants";


export default function MessageCentre() {
    const [collapsed, setCollapsed] = useState(false);

    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);

    // useEffect hook for the component did mount lifecycle event
    useEffect(() => {
        removeLayoutPadding(true);
        changeBackgroundColor(false);
        updateActiveNavigationMenu(MENU_ROUTES[4].key)
    }, []);

    const handleToggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    const {
        isLoading: isLoadingMessageData, isSuccess, data: userMessageData, error
    } = useMessageCentreDataQuery();

    if (isLoadingMessageData) {
        return (
            <EngageSpinner loaderText="Loading Discussion Boards..." />
        );
    }

    if (!isSuccess) {
        console.error(error);
        return (<div>Error Loading</div>);
    }
    const {
        user_id: userIdentifier,
        discussion_boards: discussionBoards,
        username: currentUsername
    } = userMessageData;

    const {
        research_project_boards: researchProjectBoards,
        task_discussion_boards: taskProjectBoards
    } = discussionBoards;

    // TODO: Look into ActiveChatRoomContext, We may want to use this application wide so users can click anywhere to open a chat room
    return (
        <ActiveChatRoomContextProvider>
            <MessageListTypeContextProvider>
                <div className={'message-centre-screen'}>
                    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
                        <div style={{
                            width: collapsed ? '0%' : '20%',
                            minWidth: collapsed ? '0px' : '300px',
                            transition: '0.3s',
                            opacity: collapsed ? '0' : '1',
                            position: 'relative',
                        }}>
                            {!collapsed && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: '0',
                                        transform: 'translateY(-50%)',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        zIndex: '100',
                                    }}
                                    onClick={handleToggleCollapse}
                                >
                                    <CaretLeftOutlined />
                                </div>
                            )}
                            <div className={'col-antd group-message-list'}>
                                <GroupMessageList
                                    currentUserId={userIdentifier}
                                    researchProjectBoards={researchProjectBoards}
                                    taskBoards={taskProjectBoards}
                                />
                            </div>
                        </div>
                        <div style={{
                            width: collapsed ? '100%' : '80%', transition: '0.3s'
                        }}>
                            <div style={{ width: '100%', height: '100%', background: '#eee' }}>

                                <div className={'col-antd chat-room'}>
                                    <ChatRoom username={currentUsername} currentUserIdentifier={userIdentifier} />
                                </div>
                            </div>
                            {collapsed && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '0',
                                        transform: 'translateY(-50%)',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                    }}
                                    onClick={handleToggleCollapse}
                                >
                                    <CaretRightOutlined />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </MessageListTypeContextProvider>
        </ActiveChatRoomContextProvider>
    );
}
