import React from "react";
import { Row, Table, Typography } from "antd";
import { Link } from "react-router-dom";
import { UserAvatar } from "../user_profile/user_avatar";
import { nameBasedOnUserRole } from "../utils/common";
import { anonymousTabString, optOutProjectInvitationString } from "../utils/constants.strings";
import { TagWithPopover } from "../utils";

const { Text } = Typography;

const communityListColumns = [
    {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        sorter: (a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1),
        defaultSortOrder: 'ascend',
        sortDirections: ['ascend', 'descend'],
        render: (name, record) => (
            <>
                <Row justify={"start"}>
                    <UserAvatar
                        userId={record.user}
                        size={25}
                        className="image"
                        fullName={name}
                    />
                    <p style={{ marginLeft: '1em' }}>{name}</p>
                </Row>
                <Row>
                    {record.opt_out_project_invitations &&
                        <TagWithPopover
                            popPlacement={"bottom"}
                            popoverContent={optOutProjectInvitationString}
                            tagClosable={false}
                            tagColor={"red"}
                            tagText={"No Project Invites"}
                        />
                    }
                </Row>
            </>
        ),
        width: '20%'
    },
    {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        sorter: (a, b) => (a.role.toLowerCase() < b.role.toLowerCase() ? -1 : 1),
        sortDirections: ['ascend', 'descend'],
        width: '15%'
    },
    {
        title: 'Research Interests',
        dataIndex: 'interests',
        key: 'interests',
        render: (interests) => interests.join(", ")
    },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        // Actions must be an array of objects that has a link and a name property
        render: (actions) => actions.map(action => (
            <Link to={`${action.link}/`}>
                {action.title}
            </Link>
        )),
        width: '10%'
    },
];

export default function CommunityListDetailView({ type, communityListData }) {

    // First filter out all of the users that do not have the specified role
    // if 'All' remove the anonymous user
    let filteredData = (type === 'All')
        ? communityListData.filter(x => !x?.is_anonymous)
        : communityListData.filter(x => (x.role === type));

    // If the tab is 'Anonymous', show the text
    if (type === "Anonymous") {
        return (
            <Text style={{ width: '70%', display: 'flex' }}>
                {anonymousTabString}
            </Text>
        );
    }

    // Map the user data to match the details columns defined above
    // TODO: add in profile pictures to the users name in the table
    const mappedUserData = filteredData.map(user => ({
        ...user,
        actions: [{ link: user?.profile_link, title: 'View Profile' }],
        name: nameBasedOnUserRole(user),
        interests: user?.research_interests,
        pronouns: user?.pronouns,
    }));
    return (<Table dataSource={mappedUserData} columns={communityListColumns} />);
}
