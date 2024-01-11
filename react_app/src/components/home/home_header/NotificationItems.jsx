import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Badge, Col, Divider, Dropdown, Row, Space, Typography } from 'antd';
import { BellOutlined, } from '@ant-design/icons';
import './notification_items.css';
import { selectLoggedInUserNotification, useLazyReadNotificationQuery } from "../../../redux/services/userAPI.js";
import { EngageSpinner } from "../../utils";
import { useSelector } from "react-redux";
import useWebSocket from "react-use-websocket";
import { NotificationsWebSocketContext } from "../../../providers/NotificationsWebSocketContextProvider";

const { Text } = Typography;

function getNotificationsWebSocketURL() {
    // build the websocket url by checking what protocol the user is using (http or https) and connect them to the
    // appropriate websocket protocol (wss -> https or ws -> http) then build the full websocket url
    const protocol = (window.location.protocol === 'https:')
        ? 'wss'
        : 'ws';
    const accessToken = sessionStorage.getItem('access');
    return `${protocol}://${process.env.WEBSOCKET_SERVER}/ws/notifications/?token=${accessToken}`;
}

/**
 *
 * @param {String} notificationType -Multiple notification type, (Reminder, announcement...)
 * @param {String} text -Description of the notification received
 * @param {String} date -Date of notification received
 * @param {String} identifier - the id of the notification which is used to build the read link
 * @param {Function} setReadNotificationItems - the callback function to set the read notifications list
 * @returns The content of the dropdown
 */
function NotificationDropdown(
    {
        notificationType, text, date, identifier, setReadNotificationItems
    }
) {
    const [triggerReadNotification, { isLoading }] = useLazyReadNotificationQuery();
    const navigate = useNavigate();

    // callback function to make sure we read the notification using the api call, that way we can update the
    // readAt time for the notification and can make sure the page exists before navigating them away
    const handleReadNotification = useCallback(() => {
        setReadNotificationItems(prev => [...prev, identifier]);
        triggerReadNotification(identifier).then(({ data }) => navigate(data.success)).catch(console.error);
    }, [triggerReadNotification, identifier, navigate, setReadNotificationItems]);

    return (
        <Link to="#" onClick={handleReadNotification}>
            <Row align={'middle'} justify={'start'}>
                <Col>
                    <Avatar style={{ backgroundColor: '#EAEAEA' }} size={40}
                        src={<BellOutlined style={{ color: 'black' }} />} />
                </Col>
                <Col span={19} offset={1}>
                    <Row>
                        <Text className="notification-text">{notificationType}: {text}</Text>
                    </Row>
                    <Row align={'stretch'} justify={'end'}>
                        <Text className="notification-text">{date}</Text>
                    </Row>
                </Col>
            </Row>
        </Link>
    );
}

export default function NotificationItems() {
    const [displayedNotificationItems, setDisplayedNotificationItems] = useState([]);
    const [receivedNotificationItems, setReceivedNotificationItems] = useState([]);
    const [readNotificationItems, setReadNotificationItems] = useState([]);
    const recentNotificationData = useSelector(selectLoggedInUserNotification);
    const [badgeCount, setBadgeCount] = useState(0);

    // get access to the context provider for the notifications websocket consumer
    const { updateNotificationsWebSocketContext } = useContext(NotificationsWebSocketContext);

    // callback function to map the notification JSON to notification dropdown components
    const mapNotificationToDropdown = useCallback((item, idx) => ({
        key: `${idx}`,
        label: (
            <NotificationDropdown
                notificationType={item.type}
                text={item.content}
                date={new Date(item.created_at).toDateString()}
                identifier={item.id}
                setReadNotificationItems={setReadNotificationItems}
            />
        )
    }), []);

    // callback function to filter notifications based on the read_at status
    const filterUnreadNotifications = useCallback(notification => notification.read_at === "None", []);

    // callback function to sort notifications in order of the most recent
    const sortNotificationsByCreatedAt = useCallback((notification, comparisonNotification) => {
        const currentDate = new Date(notification.created_at);
        const comparisonDate = new Date(comparisonNotification.created_at);
        return comparisonDate - currentDate;
    }, []);

    // callback function to filter out items in the array that have the matching id's in the readNotificationItems list
    const filterReadNotificationItems = useCallback(
        (item) => !readNotificationItems.includes(item.id), [readNotificationItems]
    );

    // useEffect hook to check if we have recent notifications, if we don't we can display the no notifications item
    // and if we do have notifications we can initialize the displayed notifications list.
    useEffect(() => {
        if (!recentNotificationData) {
            setDisplayedNotificationItems([{
                key: -1,
                label: (<div>Loading...</div>)
            }]);
        } else {
            setDisplayedNotificationItems([]);
        }
    }, [recentNotificationData]);

    // useEffect hook that will check the recent notifications items, if we have at least 1, we will map all the
    // notifications NotificationDropdown components or set the menu item for no new notifications
    useEffect(() => {
        if (recentNotificationData && recentNotificationData.length > 0) {
            // combine the 2 arrays for the received notifications (from the websocket) and the initial notification data
            // then filter out all items that the user has already read
            const notificationsArray = [...recentNotificationData, ...receivedNotificationItems].filter(
                filterReadNotificationItems
            );
            setDisplayedNotificationItems(
                notificationsArray.sort(sortNotificationsByCreatedAt).filter(filterUnreadNotifications).slice(
                    0, 5
                ).map(mapNotificationToDropdown)
            );
        } else {
            setDisplayedNotificationItems([{
                key: -1,
                label: (<div>No new Notifications</div>)
            }]);
        }
    }, [recentNotificationData, receivedNotificationItems, readNotificationItems]);


    // useEffect hook to set the badge count based on the displayed notifications
    useEffect(() => {
        // get the badge count based on the notification key not being -1
        setBadgeCount(
            (displayedNotificationItems.length >= 1 && displayedNotificationItems[0].key !== -1)
                ? [...recentNotificationData, ...receivedNotificationItems].filter(
                    filterReadNotificationItems
                ).filter(filterUnreadNotifications).length
                : 0
        );

    }, [displayedNotificationItems]);

    // start the websocket connection and every time we receive a message from the backend (in this case a new notification)
    // we can render the new notification in the dropdown and increment the badge count
    const { readyState } = useWebSocket(
        getNotificationsWebSocketURL(),
        {
            onOpen: async function () {
                console.log('>>> Opening the connection to the notifications consumer.');
            },
            onError: async (event) => console.error(event),
            onMessage: async function (messageEvent) {
                // get the notification data from the websocket, and after parsing make sure it is not a string
                // otherwise parse the data again
                let notificationData = JSON.parse(messageEvent.data);
                notificationData = (typeof notificationData === "string")
                    ? JSON.parse(notificationData)
                    : notificationData;

                // add the received notification to the received notification items to trigger the re-render through
                // the useEffect hooks
                setReceivedNotificationItems(prev => [...prev, notificationData]);
            },
            onClose: async (socketEvent) => console.error('Notification web socket closed...', socketEvent),
            shouldReconnect: (closeEvent) => {
                updateNotificationsWebSocketContext({ closeEvent });
                return true;
            }
        }
    );

    // useEffect hook to update the context provider for the notifications consumer with the readyState of the
    // websocket connection
    useEffect(() => updateNotificationsWebSocketContext({ readyState }), [readyState]);

    // if we do not have recent notification data (it is null not empty) we can show a loader
    if (!recentNotificationData) {
        return (<EngageSpinner loaderText="Loading notifications" display="fullscreen" />);
    }

    // return the rendered notification items
    return (
        <Dropdown
            className="notification-dropdown"
            menu={{
                items: displayedNotificationItems
            }}
            trigger={['click']}
            dropdownRender={(menu) => (
                <div className="dropdown-content">
                    {menu}
                    <Divider
                        dashed
                        style={{
                            margin: 0
                        }} />
                    <Row align={'middle'} justify={'start'} style={{ backgroundColor: '#EFEFEF', height: '42px' }}>
                        <Col offset={1}>
                            <Link to={"/notifications/"} replace={true} className="notification-text"
                                style={{ color: '#1AB759', fontSize: 12 }}>View all notifications</Link>
                        </Col>
                    </Row>
                </div>
            )}>
            <a onClick={(e) => e.preventDefault()}>
                <Space>
                    <Badge count={(badgeCount < 100) ? badgeCount : '99+'}>
                        <BellOutlined
                            style={{
                                fontSize: 30,
                                color: 'white'
                            }}>
                        </BellOutlined>
                    </Badge>
                </Space>
            </a>
        </Dropdown>
    );
}
