import React from 'react';
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { Popover } from "antd";
import { Colours } from "./index";

export default function VisibilityStatusIndicator({ isPublic, visibleMessage, hiddenMessage }) {
    const returnedIcon = (isPublic)
        ? <EyeOutlined style={{ fontSize: '2rem', fontWeight: 700, color: Colours.SUCCESS }} />
        : <EyeInvisibleOutlined style={{ fontSize: '2rem', fontWeight: 700, color: Colours.WARNING }} />;

    return (
        <Popover content={(isPublic) ? visibleMessage : hiddenMessage} title="Visiblity Settings" trigger="hover">
            {returnedIcon}
        </Popover>
    );
}
