import React from "react";
import { Card, Col, Row } from "antd";
import { Link } from "react-router-dom";
import { useUserMentionsQuery } from "../../../redux/services/researchProjectAPI.js";
import './user_recent_message_tags.css';
import { EngageSpinner } from "../../utils";

const mapUserMentionsToRecentTags = (
    {
        message,
        user_profile: userProfile,
        discussion_board: discussionBoard,
        research_project: researchProject,
        link
    }
) => {
    // using the items returned from the user mentions request, map each of the item the format required for the
    return {
        name: message.display_name,
        tagType: "mentioned you in a discussion",
        content: message.content,
        // set the link from the discussion board
        link: link || "#",
    };
};

export default function UserRecentMessageTags({ displayedItemCount = 5, researchProjectID }) {

    const {
        data: userMentionsData,
        isLoading: isLoadingUserMentions
    } = (researchProjectID) ? useUserMentionsQuery({ researchProjectID }) : {};

    if (researchProjectID === null) {
        return (
            <>
                <div className="recent-project-title">Recent Tags</div>
                <div style={{ textAlign: 'center', fontSize: '18px' }}>
                    Please select or join a project to view your recent tags for this project
                </div>
            </>
        );
    }

    // Show the load while we are loading the recent user mention tags
    if (isLoadingUserMentions) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'row',
                width: '100%',
                height: '200px',
            }}>
                <EngageSpinner useBackground={false} loaderText={"Loading Recent Tags"} />
            </div>
        );
    }

    // Show to the user that we are loading the tags if we are still loading, if we finish loading and have no data
    // returned show an empty list
    const userMentionsElement = (userMentionsData.length > 0)
        ? userMentionsData.slice(0, displayedItemCount).map(mapUserMentionsToRecentTags).map((mentionData, id) => {
            return (
                <Col key={id} span={24}>
                    <Card className="recent-tags-card">
                        <span>
                            <strong>{mentionData.name}</strong>&nbsp;{" "}
                            <span>{mentionData.tagType} </span>"{mentionData.content}"
                            <Link to={mentionData.link}> Read more</Link>
                        </span>
                    </Card>
                </Col>
            );
        })
        : (
            <div style={{ width: '100%', marginLeft: '1em' }}>
                <p style={{ textAlign: 'center' }}>You have no recent tags</p>
            </div>
        );

    return (
        <Col flex={1}>
            <Row className="recent-project-title">
                Recent Tags ({(userMentionsData) ? userMentionsData.slice(0, displayedItemCount).length : "None"})
            </Row>
            <Row className="recently-tags">
                <Row gutter={[0, 20]} style={{ paddingBottom: '1em' }}>
                    {userMentionsElement}
                </Row>
                {/* Make a view to show all user mentions */}
                {/*<Row wrap={true} style={{ flex: 1 }}>*/}
                {/*    <Link*/}
                {/*        style={{*/}
                {/*            flex: 1,*/}
                {/*            padding: "2.5px 12px",*/}
                {/*            textAlign: "right",*/}
                {/*        }}*/}
                {/*        to={"#"}*/}
                {/*    >*/}
                {/*        View All*/}
                {/*    </Link>*/}
                {/*</Row>*/}
            </Row>
        </Col>
    );
}
