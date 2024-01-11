import { InfoCircleFilled } from '@ant-design/icons';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, Upload } from 'antd';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { USER_PROFILE_PICTURE } from '../../../redux/api_url';
import { useUploadUserProfilePictureMutation } from '../../../redux/services/userAPI';
import { EngageSpinner, NotificationTypes, openNotification } from '../../utils';
import './userAvatarUploader.css';

const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
const validImageExtensions = '.jpeg,.jpg,.png';
const UserAvatarUploader = ({ userId, fullName, disabled = false, size }) => {


    const userProfilePictureEndpoint = `${process.env.REACT_APP_BASE_URL}${USER_PROFILE_PICTURE}${userId}`;
    const [profilePictureSrc, setProfilePictureSrc] = useState(userProfilePictureEndpoint);
    const [uploadUserProfilePicture, { isLoading: isPictureUploading }] =
        useUploadUserProfilePictureMutation();

    useEffect(() => {
        setProfilePictureSrc(
            isPictureUploading ? (
                <EngageSpinner loaderText={'Uploading...'} />
            ) : (
                `${userProfilePictureEndpoint}?time=${Date.now()}`
            )
        );
    }, [isPictureUploading, userId]);

    const handleUploadValidation = useCallback((file) => {
        const correctType = validImageTypes.some((t) => t === file.type);

        if (!correctType) {
            openNotification({
                placement: 'topRight',
                message: 'Cannot upload profile picture',
                description: 'File must be of JPEG/JPG/PNG type',
                icon: <InfoCircleFilled style={{ color: 'red' }} />,
                type: NotificationTypes.ERROR,
            });
        }
        return correctType;
    }, [openNotification, InfoCircleFilled, NotificationTypes]);

    const handleAvatarUpload = useCallback((file) => {
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('picture', file);
        uploadUserProfilePicture(formData).then((response) => {
            if (!response.error) {
                openNotification({
                    placement: 'topRight',
                    message: 'Successfully updated your profile picture',
                    icon: <InfoCircleFilled style={{ color: 'green' }} />,
                    type: NotificationTypes.SUCCESS,
                });
                return;
            }
            const {
                error: {
                    data: { error },
                },
            } = response;

            openNotification({
                placement: 'topRight',
                message: 'An error occurred while uploading the profile picture',
                description: error,
                icon: <InfoCircleFilled style={{ color: 'red' }} />,
                type: NotificationTypes.ERROR,
            });
        });
    }, [userId, uploadUserProfilePicture, openNotification, InfoCircleFilled, NotificationTypes]);

    const doNothing = useCallback(() => { }, []);

    return <Upload
        className='avatar-upload-wrapper'
        action={handleAvatarUpload}
        beforeUpload={handleUploadValidation}
        showUploadList={false}
        customRequest={doNothing}
        disabled={disabled}
        accept={validImageExtensions}
    >
        <Avatar
            src={profilePictureSrc}
            size={size}
            alt={`the profile image of ${fullName}`}
            className='user-avatar'
        />
        {!disabled && <div className='upload-icon-wrapper' style={{ height: `${size}px`, width: `${size}px` }}>
            <FontAwesomeIcon icon={faCamera} fontSize={35} />
        </div>}
    </Upload>
}

export default memo(UserAvatarUploader);
