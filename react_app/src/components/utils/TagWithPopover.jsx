import React from "react";

import { Popover, Tag } from "antd";

export const TagWithPopover = ({ popoverContent, tagClosable, tagColor, tagStyle, tagText, popPlacement, tagIcon }) => {
    return (
        <Popover overlayStyle={{maxWidth: '550px'}} content={popoverContent} placement={popPlacement}>
            <Tag
                style={{ ...tagStyle, cursor: 'pointer' }}
                color={tagColor}
                closable={tagClosable}
                icon={tagIcon}
            >
                {tagText}
            </Tag>
        </Popover >
    );
}
