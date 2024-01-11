import { DownOutlined, InfoCircleOutlined, RightOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Col, Divider, Dropdown, Row, Space, Typography } from 'antd';
import React, { useContext } from 'react';
import { useSelector } from "react-redux";
import { selectLoggedInUserData } from '../../../redux/services/userAPI';
import { UserAvatar } from '../../user_profile/user_avatar';
import './profile_items.css';
import { Link } from "react-router-dom";
import { NotificationsWebSocketContext } from "../../../providers/NotificationsWebSocketContextProvider";
import ConnectionStatusIcon from "../../utils/ConnectionStatusIcon";

const { Title, Text } = Typography;

/**
 *
 * @param {ReactElement} icon - element icons
 * @param {String} title -element name (Profile, FAQ, Support, etc..)
 * @todo change the icon according to the designs, waiting for the designs to be developer ready.
 * @returns The content of profile section drop down
 */
function ProfileDropdown({ icon, title }) {
    return (
        <Row align={'middle'} wrap={true} justify={'start'}>
            <Col>
                <div className="profile-dropdown-section">
                    {icon}
                </div>
            </Col>
            <Col offset={2} flex={3}>
                <div className="profile-dropdown-title">{title}</div>
            </Col>
            <Col>
                <RightOutlined />
            </Col>
        </Row>
    );
}

/**
 *
 * @returns The header of profile section dropdown
 */
const EditProfile = ({ currentUserFullName, currentUserIdentifier }) => {
    const { notificationsWebSocketContext } = useContext(NotificationsWebSocketContext);

    return (
        <Row align={'middle'} style={{ padding: '12px' }}>
            <Col span={7} offset={1}>
                <UserAvatar
                    userId={currentUserIdentifier}
                    size={65}
                    fullName={currentUserFullName}
                />
            </Col>

            <Col span={100} offset={0} flex="auto">
                <Title
                    style={{
                        margin: 0,
                        color: '#002E6D'
                    }}
                    level={3}
                >
                    {currentUserFullName}
                </Title>
                <span>
                    Server Status:
                    <ConnectionStatusIcon
                        readyState={notificationsWebSocketContext.readyState}
                        margin={"0 0.5em"}
                    />
                </span>
            </Col>
        </Row>
    );
};

export default function ProfileItems({ logout }) {

    /**
     *
     * @param {ReactElement} logout -Logout conmponent
     * @returns
     */

    const userData = useSelector(selectLoggedInUserData);

    if (userData) {
        const currentUserFullName = userData.user.full_name;
        const currentUserIdentifier = userData.user.id;
        const currentUserInitials = `${userData.user.first_name.charAt(0)}.${userData.user.last_name.charAt(0)}`;

        const profileContent = [
            {
                key: '0',
                label: (
                    <Link to={`/app/user/${currentUserIdentifier}/`}>
                        <ProfileDropdown
                            icon={<UserOutlined className="profile-dropdown-icon" />}
                            title="My Profile"
                        />
                    </Link>
                )
            },
            {
                type: 'divider'
            },
            {
                key: '2',
                label: (
                    <Link to={"/edit_profile/"}>
                        <ProfileDropdown
                            icon={<SettingOutlined className="profile-dropdown-icon" />}
                            title="Edit Profile"
                        />
                    </Link>
                )
            },
            {
                type: 'divider'
            },
            {
                key: '3',
                label: (
                    <Link to={'/contact_us/'}>
                        <ProfileDropdown
                            icon={<InfoCircleOutlined className="profile-dropdown-icon" />}
                            title="Support"
                        />
                    </Link>
                )
            },
            {
                type: 'divider'
            },
        ];

        return (
            <Dropdown
                menu={{ items: profileContent }}
                trigger={["click"]}
                dropdownRender={(menu) => (
                    <div className="dropdown-content">
                        <EditProfile
                            currentUserFullName={currentUserFullName}
                            currentUserIdentifier={currentUserIdentifier}
                        />
                        <Divider style={{ margin: 0 }} />
                        {menu}
                        {logout}
                    </div>
                )}
            >
                <a onClick={(e) => e.preventDefault()}>
                    <UserAvatar
                        userId={currentUserIdentifier}
                        size={40}
                        fullName={currentUserInitials}
                        style={{ marginRight: '8px' }}
                    />
                    <Space>
                        <DownOutlined />
                    </Space>
                </a>
            </Dropdown>
        );
    }
}
