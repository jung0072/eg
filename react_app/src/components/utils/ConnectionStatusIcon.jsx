import React from 'react';
import { connectionStatus } from "./constants";
import { DANGER, WARNING, SUCCESS, GREYED } from "./colors";
import { ReadyState } from "react-use-websocket";
import { InfoCircleFilled } from "@ant-design/icons";


export default function ConnectionStatusIcon({ readyState, margin = "0 1em" }) {
    const currentConnectionStatus = connectionStatus[readyState];
    const connectionStatusLabel = (currentConnectionStatus === "Open" || currentConnectionStatus === "Closed")
        ? (currentConnectionStatus === "Open") ? "Online" : "Offline"
        : currentConnectionStatus;
    let displayColour;

    switch (currentConnectionStatus) {
        case 'Connecting':
            displayColour = WARNING;
            break;
        case 'Open':
            displayColour = SUCCESS;
            break;
        case 'Closing':
            displayColour = WARNING;
            break;
        case 'Closed':
            displayColour = DANGER;
            break;
        case 'Uninstantiated':
            displayColour = GREYED;
            break;
    }

    return (
        <span style={{ fontSize: 12, margin }}>
            <InfoCircleFilled style={{ color: displayColour, marginRight: '0.2em' }} />
            {connectionStatusLabel}
        </span>
    );
}
