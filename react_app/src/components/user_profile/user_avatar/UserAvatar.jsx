import { Avatar } from 'antd';
import React, { memo } from "react";
import { USER_PROFILE_PICTURE } from '../../../redux/api_url';

const UserAvatar = ({ userId, fullName, size, className, style }) => {

    const userProfilePictureEndpoint = `${process.env.REACT_APP_BASE_URL}${USER_PROFILE_PICTURE}${userId}`;

    return <Avatar
        size={size}
        className={className}
        src={userProfilePictureEndpoint}
        alt={`The profile picture of ${fullName}`}
        style={style}
    />
}

export default memo(UserAvatar);
