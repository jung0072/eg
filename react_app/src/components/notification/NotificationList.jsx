import { Avatar, List, Skeleton } from "antd";
import React, { useCallback } from "react";
import "./notification.css";
import { useLazyReadNotificationQuery } from "../../redux/services/userAPI";
import { useNavigate, Link } from "react-router-dom";

// keep this Object matched up with the NotificationTypes from communication_app.utils
const NOTIFICATION_TYPES = {
    USER: "User Message",
    SYSTEM: "System Message",
    DISCUSSION: "Discussion Board",
    PROJECT: "Research Project",
    ACCOUNT: "Account",
    MENTION: "Mentioned in Comment",
};

export default function NotificationList({ notificationData }) {
    const navigate = useNavigate();

    // function to render the notification list items that are returned from the backend api
    const renderNotificationListItem = (item, index) => {
        const [triggerReadNotification] = useLazyReadNotificationQuery();

        const handleReadNotification = useCallback(() => {
            triggerReadNotification(item.id).then(({ data }) => navigate(data.success)).catch(console.error);
        }, [triggerReadNotification, item.id, navigate]);

        const renderedAvatarSrc = (item.type === NOTIFICATION_TYPES.MENTION || item.type === NOTIFICATION_TYPES.USER)
            ? `/app/profile/${item.source_id}/image`
            : null;
        const titleAnchor = (<Link to="#" onClick={handleReadNotification}>{item.source_name}</Link>);
        const notificationContent = (<>{item.content}</>);
        const notificationDate = new Date(item.created_at);

        return (
            <List.Item key={`${item.id}-${index}`}>
                <Skeleton avatar title={false} loading={item.loading} active>
                    <List.Item.Meta
                        avatar={<Avatar src={renderedAvatarSrc}/>}
                        title={titleAnchor}
                        description={notificationContent}
                    />
                    <div>{notificationDate.toLocaleDateString()}</div>
                </Skeleton>
            </List.Item>
        );
    };

    // return the notifications list
    return (
        <>
            <List
                className="user-notification-list"
                itemLayout="horizontal"
                dataSource={notificationData}
                renderItem={renderNotificationListItem}
            />
        </>
    );
}
