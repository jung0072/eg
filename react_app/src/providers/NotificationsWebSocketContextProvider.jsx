import React, { createContext, useState } from 'react';

// Create the context
const NotificationsWebSocketContext = createContext();

function NotificationsWebSocketProvider(props) {
    const [notificationsWebSocketContext, setNotificationsWebSocketContext] = useState({
        readyState: null,
        closeEvent: null,
    });

    // Define the function to update the state
    const updateNotificationsWebSocketContext = (updatedValues) => {
        setNotificationsWebSocketContext(
            previousValue => ({ ...previousValue, ...updatedValues })
        );
    };

    return (
        <NotificationsWebSocketContext.Provider
            value={{ notificationsWebSocketContext, updateNotificationsWebSocketContext }}
            {...props}
        />
    );
}

export { NotificationsWebSocketContext, NotificationsWebSocketProvider };
