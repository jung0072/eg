import { Button, Col, Row, Tabs, Typography } from "antd";
import React, { useContext, useEffect } from "react";
import "../components/notification/notification.css";
import { BellFilled, CheckOutlined, CheckCircleOutlined } from "@ant-design/icons";
import NotificationList from "../components/notification/NotificationList";
import { selectLoggedInUserNotification, useLazyReadAllUserNotificationsQuery, } from "../redux/services/userAPI.js";
import { EngageSpinner, openNotification } from "../components/utils";
import { useSelector } from "react-redux";
import { useEngageStylingLayout } from "../providers/EngageLayoutStylingContextProvider";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";

const { Title } = Typography;

export default function NotificationScreen() {
    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);

    // loading the data of the messages
    const recentNotificationData = useSelector(selectLoggedInUserNotification);

    // we can use the React redux toolkit hook to read all user notifications lazily, which means we can call this later
    // inside the handleReadAllButtonClick callback. We can rerender the component whenever this button is clicked and
    // the data from the backend is returned
    const [triggerReadAllNotifications, { readNotificationData, error }] = useLazyReadAllUserNotificationsQuery();
    useEffect(() => {
    }, [readNotificationData]);

    // useEffect Hook for component did mount life cycle event
    useEffect(() => {
        // remove the padding
        removeLayoutPadding(false);
        // remove the white background color
        changeBackgroundColor(false);
        // reset the navigation context
        updateActiveNavigationMenu('')
    }, []);
    const handleReadAllButtonClick = () => {
        triggerReadAllNotifications().then(() => {
                openNotification({
                    placement: 'topRight',
                    message: "Read Notifications",
                    description: "Success: All notifications have been marked as read",
                    icon: (<CheckCircleOutlined style={{ color: "green" }} />),
                    callback: () => window.location.reload(),
                    timeout: 500
                });
            }
        ).catch(console.error);
    };

    if (!recentNotificationData) {
        return (<EngageSpinner loaderText="Loading notifications" display="fullscreen" />);
    }

    // create the unread notifications list by filter out all items that do not have read_at set
    const unreadNotificationList = recentNotificationData.filter(item => item?.read_at === "None");
    // create the 2 tabs with the notifications list
    const notificationListItems = [
        {
            label: `Unread (${unreadNotificationList.length})`,
            key: '0',
            children: (
                <NotificationList notificationData={unreadNotificationList} />
            )
        },
        {
            label: `All (${recentNotificationData.length})`,
            key: '1',
            children: (
                <NotificationList notificationData={recentNotificationData} />
            )
        }
    ];

    // if the unread notifications list is empty then lets just show the default tab as the All Notifications view
    const defaultNotificationTab = (unreadNotificationList.length !== 0) ? '0' : '1';
    return (
        <div className={'notification-screen'}>
            <Row>
                <Col span={24}>
                    <Title className={"notification-title"} level={2}>
                        Notifications <BellFilled style={{ color: "#002E6D" }} />
                    </Title>
                </Col>
            </Row>
            <Row align={"middle"} justify={"space-between"}>
                <Col span={24}>
                    <Tabs
                        defaultActiveKey={defaultNotificationTab}
                        items={notificationListItems}
                        tabBarExtraContent={
                            (unreadNotificationList.length > 0)
                                ? (
                                    <Button onClick={handleReadAllButtonClick}>
                                        <CheckOutlined />
                                        Mark all as read
                                    </Button>
                                )
                                : null
                        }
                    />
                </Col>
            </Row>
        </div>
    );
}
