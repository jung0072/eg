import React, { memo } from 'react';

import { Alert, Col, Layout, Row, Typography } from 'antd';
import { EyeInvisibleOutlined } from "@ant-design/icons";

import { HumanizedUserRoles } from "../utils/constants";
import { anonymousUserProfileViewString, optOutProjectInvitationString, pendingResearchPartnerApproval } from "../utils/constants.strings";
import { nameBasedOnUserRole } from '../utils/common';
import { EngageActionButton, ReportItem, TagWithPopover } from '../utils/index';

import { UserAvatarUploader } from './user_avatar_uploader';
import UserBreadCrumbs from "./UserBreadCrumbs";

const researchPartnerRoles = [
    HumanizedUserRoles.CLINICIAN,
    HumanizedUserRoles.RESEARCHER
];
const { Title, Text } = Typography;

const userProfileHeaderStyles = {
    container: {
        padding: 0,
    },
    splashHeader: {
        width: '100%',
        height: '116px',
        backgroundColor: '#838383',
        position: 'relative',
    },
    userHeader: {
        position: 'relative',
        top: -45,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: '2em',
    },
    title: {
        margin: 0,
    },
    subTitle: {
        fontSize: '18px',
        fontWeight: 400,
        fontFamily: 'Inter',
    },
    reportButton: {
        position: 'absolute',
        top: '14px',
        right: '14px',
    },
    engageActionStyle: {
        reportIconStyle: {
            color: 'white',
            fontSize: '1.5rem',
        }
    },
    projectTagPositioning: {
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
    },
    nameTagContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        marginTop: '1.5rem',
    },
};

const UserProfileHeader = ({ userInfo, currentUserData }) => {
    // first destructure out the required properties for this user profile
    const {
        user: userId,
        first_name: firstName,
        last_name: lastName,
        role,
        icu_city: icuLocation,
        is_approved_researcher: isApprovedResearcher,
        active_projects,
        opt_out_project_invitations: optedOutFromProjects,
    } = userInfo || {};

    let displayedName = "";
    const { id: loggedInUserId, is_anonymous: currentUserAnonymous, active_projects: current_user_projects } = currentUserData;
    // TODO: Remove the s from patient partners in the db when saving, should be patient partner
    // Temporary fix to remove the s since no other roles end pluralized
    const displayedRole = (role?.charAt(role.length - 1) !== 's')
        ? role
        : role.substring(0, role?.length - 1);

    const currentUserProjectIds = current_user_projects?.map(item => item['research_project'].id);

    let foundMatch = false;  // Initialize a flag to track if a match is found

    currentUserProjectIds.forEach(projectId => {
        if (active_projects?.map(item => item.id).includes(projectId)) {
            displayedName = `${firstName} ${lastName}`;
            foundMatch = true;  // Set the flag to true if a match is found
            return;  // Break the loop when a match is found
        }
    });

    // If no match is found, set the shorthand displayedName based on the Role
    if (!foundMatch) {
        displayedName = nameBasedOnUserRole(userInfo);
    }
    // if the logged-in user is viewing their profile, and they are a research partner, and they are unapproved
    // show the unapproved researcher alert
    const researcherApprovalAlert = (userId === loggedInUserId && researchPartnerRoles.includes(role) && !isApprovedResearcher)
        ? (
            <Alert
                message={"Research Partner, pending admin approval"}
                description={pendingResearchPartnerApproval}
                type="info"
                closable={true}
            />
        )
        : null;

    return (
        <Layout style={userProfileHeaderStyles.container}>
            {researcherApprovalAlert}
            <Row>
                <Col span={24}>
                    <div style={userProfileHeaderStyles.splashHeader}>
                        <div style={{ padding: '1em' }}>
                            <UserBreadCrumbs type={'PROFILE'} userData={userInfo} color={'#FAFAFA'} />
                        </div>
                        <div style={userProfileHeaderStyles.reportButton}>
                            {userInfo?.user != loggedInUserId && < Col span={3}>
                                <EngageActionButton
                                    itemID={userInfo?.user}
                                    type="USER"
                                    engageActionStyle={userProfileHeaderStyles.engageActionStyle}
                                    actionComponent={
                                        <ReportItem
                                            reportData={{ id: userInfo?.user, type: "USER" }}
                                        />
                                    }
                                />
                            </Col>}
                        </div>
                    </div>
                </Col>
            </Row>
            <Row style={userProfileHeaderStyles.userHeader}>
                <Col span={6}>
                    <UserAvatarUploader
                        userId={userId}
                        fullName={displayedName}
                        disabled={loggedInUserId !== userId}
                        size={177}
                    />
                </Col>
                <Col span={18} style={userProfileHeaderStyles.nameTagContainer}>
                    <Title style={userProfileHeaderStyles.title} level={1}>
                        {displayedName}
                    </Title>
                    <Text style={userProfileHeaderStyles.subTitle}>
                        <strong>{displayedRole}</strong>{`${(icuLocation && icuLocation !== '') ?
                            <strong>, {icuLocation}</strong> : ''}`}
                    </Text>
                    <Row>
                        {optedOutFromProjects && (
                            <div style={userProfileHeaderStyles.projectTagPositioning}>
                                <TagWithPopover
                                    popoverContent={optOutProjectInvitationString}
                                    tagClosable={false}
                                    tagColor={"red"}
                                    tagText={"No Project Invites"}
                                />
                                {/* if the user is viewing their own profile check if they are anon and show anon tag */}
                                {userId === loggedInUserId && currentUserAnonymous && (
                                    <TagWithPopover
                                        popoverContent={anonymousUserProfileViewString}
                                        tagClosable={false}
                                        tagColor={"grey"}
                                        tagText={"Anonymous Profile"}
                                        tagIcon={<EyeInvisibleOutlined />}
                                    />
                                )}
                            </div>
                        )}
                    </Row>
                </Col>
            </Row>
        </Layout>
    );
};

export default memo(UserProfileHeader);
