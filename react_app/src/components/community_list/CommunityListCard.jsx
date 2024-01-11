import { Button, Divider, List, Typography, Col, Row, } from "antd";
import { UserAvatar } from "../user_profile/user_avatar";
import React from "react";
import { Link } from "react-router-dom";
import { nameBasedOnUserRole } from "../utils/common";
import { TagWithPopover } from "../utils";
import { optOutProjectInvitationString } from "../utils/constants.strings";

export default function CommunityListCard({ userInfo }) {
    // Display the interests container only if the user has supplied research interests. For now we are displaying
    // the first interests returned but ideally we should be displaying their primary interests once we create a
    // a question input for select primary and other
    const interestsList = (userInfo.interests.length > 0)
        ? userInfo.interests.slice(0, 1)
        : ["None"];

    // TODO: Only show the users primary interest
    const interestsContainer = (
        <div>
            <Typography.Text>
                Interests:
            </Typography.Text>
            <div className="list">
                {interestsList.map((text, index) => (
                    <div key={index}>
                        <div className="item">{text}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    // We should render an empty string in the pronouns list to make sure all cards stay the same height
    const pronounsList = (userInfo.pronouns.length > 0)
        ? userInfo.pronouns
        : [''];
    const pronounsContainer = (
        <div className="list">
            {pronounsList.map((text, index) => (
                <div key={index}>
                    <Typography.Text strong={true} italic={true}>{text}</Typography.Text>
                    {index !== userInfo.pronouns.length - 1 ? <Divider type="vertical" /> : null}
                </div>
            ))}
        </div>
    );

    const userFullName = nameBasedOnUserRole(userInfo);

    return (
        <List.Item>
            <div className="container">
                <Row style={{ flexDirection: 'column', flex: 1.5 }} gutter={[21, 21]}>
                    <Col>
                        <UserAvatar
                            userId={userInfo.user}
                            size={100}
                            className="image"
                            fullName={userFullName}
                        />
                    </Col>
                    <Col>
                        {userInfo.opt_out_project_invitations &&
                            <TagWithPopover
                                popoverContent={optOutProjectInvitationString}
                                tagClosable={false}
                                tagColor={"red"}
                                tagText={"No Project Invites"}
                            />
                        }
                    </Col>
                </Row>
                <div className="info" style={{ paddingLeft: '10%', flex: 4, }}>
                    <div>
                        <Typography.Title level={3} style={{ marginBottom: 0 }}>
                            {userFullName}
                        </Typography.Title>
                        {pronounsContainer}
                        <Typography.Text>
                            <b>{userInfo.role} {(userInfo.city && userInfo.city !== '') ? `- ${userInfo.city} ` : null}</b>
                        </Typography.Text>
                    </div>
                    <br />
                    {interestsContainer}
                    <br />
                    <div>
                        <Link to={userInfo.profile_link}>
                            <Button style={{ borderRadius: '5px', }}>View Profile</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </List.Item>
    );
}
