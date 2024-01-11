import React from 'react';
import {
    Image,
    Space,
} from 'antd';
import './header_home.css';
import engageIC4ULogo from '../../../imgs/engage-condensed-logo-white.svg';
import NotificationItems from './NotificationItems.jsx';
import ProfileItems from './ProfileItems.jsx';
import { Logout } from '../../utils/';
import { useNavigate } from "react-router-dom";
import { ReportIssueButton } from "./ReportIssueButton";
import { SuggestImprovementsButton } from "./SuggestImprovementsButton";

function HeaderHome() {
    const navigate = useNavigate();
    return (
        <>
            <div className="engage-ic4u-logo">
                <Image
                    preview={false}
                    src={engageIC4ULogo}
                    alt={"The Logo of the Engage Platform"}
                    onClick={() => navigate('/home/')}
                    style={{
                        width: '150px',
                        height: '60px',
                        fill: 'black'
                    }}
                />
            </div>
            <Space size={'large'}>

                {/* Button to suggest improvements to engage*/}
                <SuggestImprovementsButton />

                {/*Report Issue Button */}
                <ReportIssueButton />

                {/* Notification section */}
                <NotificationItems />

                {/* Edit Profile Section  */}
                <div
                    style={{ marginBottom: '12px' }}
                >
                    <ProfileItems logout={<Logout />} />
                </div>

            </Space>
        </>
    );
}

export default React.memo(HeaderHome);
