import React from "react";
import { Col, Layout, Row, Typography } from "antd";
import { EngageSpinner } from "../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faLinkedinIn, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import UserProfileResume from "./UserProfileResume";
import UserProfileProjectList from "./UserProfileProjectList";
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export default function UserProfileContents({ userInfo, currentUserData }) {

    if (!userInfo) {
        return (<EngageSpinner loaderText={"Loading user profile"} />);
    }
    const { user: displayedUserID } = userInfo;
    const {
        is_admin: currentUserIsAdmin,
        is_researcher: currentUserIsActiveResearcher,
        id: currentUserID
    } = currentUserData || {};

    // check if the current user is an admin, an active researcher or the same user as the profile he is looking at
    // and then we can show the user profile resume details
    // TODO: give options to users to select which variables appear on the profile
    const displayedResumeDetails = (currentUserIsAdmin || currentUserIsActiveResearcher || currentUserID === displayedUserID)
        ? (<UserProfileResume userData={userInfo} currentUserID={currentUserID} />)
        : null;

    // build the user projects list if they have active projects, if not we can just return the user profile details
    // in one column (instead of a 2 column layout with the projects)
    const displayedUserProjectsList = (userInfo.active_projects.length > 0)
        ? (
            <Col span={6}>
                <UserProfileProjectList projectList={userInfo.active_projects} />
            </Col>
        )
        : null;

    return (
        <Layout>
            <Row style={{ paddingBottom: "3em", margin: '0 2em 0 2em' }}>
                <Col span={(userInfo.active_projects.length > 0) ? 18 : 24}>
                    <AboutMe userInfo={userInfo} />
                    <UserResume userInfo={userInfo} />
                    {displayedResumeDetails}
                </Col>
                {displayedUserProjectsList}
            </Row>
        </Layout>
    );
}

// The about me section includes and bio and link to the social media
function AboutMe({ userInfo }) {
    const {
        twitter_link,
        facebook_link,
        instagram_link,
        linkedin_link,
        email,
        bio
    } = userInfo;
    const socialIcons = [
        {
            link: twitter_link,
            icon: <FontAwesomeIcon style={aboutMeStyles.socialIcons} icon={faTwitter} />
        },
        {
            link: facebook_link,
            icon: <FontAwesomeIcon style={aboutMeStyles.socialIcons} icon={faFacebookF} />
        },
        {
            link: instagram_link,
            icon: <FontAwesomeIcon style={aboutMeStyles.socialIcons} icon={faInstagram} />
        },
        {
            link: linkedin_link,
            icon: <FontAwesomeIcon style={aboutMeStyles.socialIcons} icon={faLinkedinIn} />
        },
        {
            link: `mailto:${email}`,
            icon: <FontAwesomeIcon style={aboutMeStyles.socialIcons} icon={faEnvelope} />
        }
    ];

    const bioElement = (bio)
        ? (<Paragraph style={aboutMeStyles.bioText}>{bio}</Paragraph>)
        : (<Paragraph style={aboutMeStyles.bioText}>No bio provided</Paragraph>);

    return (
        <Col span={24}>
            <Title style={userProfileContentsStyle.textTitle} level={3}>About Me</Title>
            {bioElement}
            <Row style={{ marginTop: '28px' }}>
                {socialIcons.filter(socialBtn => socialBtn.link).map((socialData, index) => {
                    return (
                        <Col key={`social-${index}`} span={2}>
                            <Link to={socialData.link} target="_blank" style={aboutMeStyles.socialIconsContainer}>
                                {socialData.icon}
                            </Link>
                        </Col>
                    );
                })}
            </Row>
        </Col>
    );
}

// user resume consist of all the expertise and experience of the user
function UserResume({ userInfo }) {
    const notDisplayedValues = ["NA", "ANOTHER"];
    const { most_used_language: mostUsedLanguageArray } = userInfo;
    return (
        <Col span={24} style={{ marginTop: '1.5em' }}>
            {
                (userInfo.contact_acknowledgements?.length > 0)
                    ? (
                        <Row>
                            <Col span={24}>
                                <Title style={userProfileContentsStyle.textTitle}>Open to:</Title>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
                                    {userInfo.contact_acknowledgements.map((openTo, index) => {
                                        return <div key={index}
                                            style={userProfileContentsStyle.chipContainer}>{openTo}</div>;
                                    })}
                                </div>
                            </Col>
                        </Row>
                    )
                    : null
            }
            {
                (userInfo.research_interests.length > 0)
                    ? (
                        <Row>
                            <Col span={24}>
                                <Title style={userProfileContentsStyle.textTitle}>Interests:</Title>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
                                    {userInfo.research_interests.map((interest, index) => {
                                        return (
                                            <div key={index}
                                                style={userProfileContentsStyle.chipContainer}>{interest}</div>
                                        );
                                    })}
                                </div>
                            </Col>
                        </Row>
                    )
                    : null
            }
        </Col>
    );
}

const userProfileContentsStyle = {
    textTitle: {
        fontWeight: 600,
        fontSize: '1.5em',
        lineHeight: '42px',
        letterSpacing: '0.1px',
        color: '#002E6D',
    },
    chipContainer: {
        display: 'inline-block',
        height: '37px',
        minWidth: '120px',
        padding: '0 1em',
        border: '1px solid black',
        borderRadius: '4.38538px',
        textAlign: 'center',
        lineHeight: '37px',
        fontWeight: 700,
        fontSize: '15px',
        letterSpacing: '0.0626482px',
        color: '#002E6D',
        marginBottom: '1em'
    }
};

const aboutMeStyles = {
    socialIconsContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '49px',
        width: '49px',
        borderRadius: '50%',
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 0.5px 10px 1px #D8D8D8',
        fontSize: '2em',
        color: 'white',
    },
    socialIcons: {
        color: '#000000'
    },
    bioText: {
        fontWeight: 500,
        fontSize: '15px',
        lineHeight: '18px',
        letterSpacing: '0.2px',
        color: '#949494',
        width: '70%'
    }
};

const userResumeStyles = {
    userExperience: {
        container: {
            width: '632px',
            height: '89px',
            border: '1px solid #AFAFAF',
            borderRadius: '4.38538px',
            padding: '0 1em'
        },
        titleText: {
            fontWeight: 700,
            fontSize: '18px',
            lineHeight: '22px',
            letterSpacing: '0.0626482px',
            color: '#000000',
        },
        bodyText: {
            fontWeight: 400,
            fontSize: '15px',
            lineHeight: '18px',
            letterSpacing: '0.0626482px',
            color: '#000000',
        },
        dateContainer: {
            height: '37px',
            minWidth: '123px',
            backgroundColor: '#E5E5E5',
            borderRadius: '4.5px',
            textAlign: 'center',
            color: '#000000',
            lineHeight: '37px',
            fontWeight: 700,
            fontSize: '15px',
        }
    },
    userInterests: {
        container: {
            minWidth: '300px',
            height: '39px',
            border: '1px solid #E7E7E7',
            borderRadius: '5px',
            padding: '0 1em'
        },
        titleText: {
            fontWeight: 700,
            fontSize: '15px',
            lineHeight: '18px',
            color: '#1F1F1F',
        },
        bodyText: {
            fontWeight: 400,
            fontSize: '15px',
            lineHeight: '18px',
            color: '#52575C',
        }
    }
};

const picuExperienceStyle = {
    picuExperience: {
        container: {
            width: '632px',
            height: 'auto',
            border: '1px solid #AFAFAF',
            borderRadius: '4.5px',
            fontWeight: 500,
            fontSize: '15px',
            lineHeight: '18px',
            letterSpacing: '0.2px',
            color: '#949494',
            padding: '1em'
        }
    }
};
