import { Col, Popover, Row, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import './projectDetailsVisitorView.css';
import { Constants } from '../../../utils';
import { getEstimatedDates } from '../../../utils/common';
import VisibilityStatusIndicator from "../../../utils/VisibilityStatusIndicator";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid  } from '@fortawesome/fontawesome-svg-core/import.macro';
import { projectArchivedState } from '../../../utils/constants.strings';

const { HumanizedUserRoles, ResearchProjectStudyFormats, ResearchProjectTypes, ProjectRecruitingStatus } = Constants;
const { Paragraph } = Typography;

const renderList = (items) => (
    <ul>
        {items.map((item, index) => (
            <li key={index}>{item}</li>
        ))}
    </ul>
);

const renderTags = (items) => (
    <Row justify="space-between">
        {items.map((item, index) => (
            <Col key={index}>
                <div className="tag">{item}</div>
            </Col>
        ))}
    </Row>
);

const Attribute = (props) => {
    const { title, content, contentNode } = props;
    const { Text, Title } = Typography;

    return (
        <div className="attribute">
            <Text className="title">{title}</Text>
            {
                (contentNode)
                    ? contentNode
                    : <Title level={5} className="content">
                        {content}
                    </Title>
            }
        </div>
    );
};

export const makeVisibleStyles = {
    visibility: 'visible',
    opacity: 1,
};

export const makeHiddenStyles = {
    maxHeight: 0,
    visibility: 'hidden',
    opacity: 0,
    margin: 0,
    padding: 0,
};

export default function ({ researchProjectData }) {
    /* TODO: Add institutions to the research project model*/
    /* TODO: Add recruiting status  to the research project model*/
    // TODO: Get the status of the user that is visiting the project, are the a visitor or a member?
    const { Text, Title, Link } = Typography;

    const [compact, setCompact] = useState(true);
    const [compactVisibleStyles, setCompactVisibleStyles] = useState(makeVisibleStyles);
    const [compactHiddenStyles, setCompactHiddenStyles] = useState(makeHiddenStyles);

    const handleShowMoreBtn = useCallback(() => {
        setCompact(!compact);
    }, [compact]);

    useEffect(() => {
        setCompactVisibleStyles(compact ? makeVisibleStyles : makeHiddenStyles);
        setCompactHiddenStyles(!compact ? makeVisibleStyles : makeHiddenStyles);
    }, [compact, makeVisibleStyles, makeHiddenStyles]);

    // using the returned research project data, prep any labels and then return it in the JSX
    const projectCreatedAtDate = new Date(researchProjectData.created_at);
    const projectStartDate = (researchProjectData.is_using_start_date)
        ? getEstimatedDates(researchProjectData).startDate
        : "Not Set";
    const projectEndDate = (researchProjectData.is_using_end_date)
        ? getEstimatedDates(researchProjectData).endDate
        : "Not Set";
    // For both project type and study format, check if the value is not null 
    // and then check if the value is in the constants values and 
    // if it is, use the label, otherwise use the value
    const projectType = (researchProjectData.type)
        ? ResearchProjectTypes.hasOwnProperty(researchProjectData.type) ? ResearchProjectTypes[researchProjectData.type] : researchProjectData.type
        : "Not Set";
    const projectStudyFormat = (researchProjectData.study_format)
        ? researchProjectData.study_format.map((study_format) => {
            return ResearchProjectStudyFormats.hasOwnProperty(study_format)
                ? ResearchProjectStudyFormats[study_format]
                : study_format;
        }) : "Not Set";
    const projectStudyFormatTags = projectStudyFormat != "Not Set" ? renderTags(projectStudyFormat) : "Not Set";
    const projectCentreFormat = (researchProjectData.centre_format)
        ? researchProjectData.centre_format
        : "Not Set";

    // render the tags for the research project data if they are supplied
    const projectPartnersRequired = (researchProjectData.roles_needed && researchProjectData.roles_needed.length > 0)
        ? renderTags(researchProjectData.roles_needed.map(role => HumanizedUserRoles[role]))
        : renderTags(['Not Set']);

    const projectResearchInterests = (researchProjectData.displayed_research_interests && researchProjectData.displayed_research_interests.length > 0)
        ? renderTags(researchProjectData.displayed_research_interests)
        : renderTags(['Not Set']);

    const researchProjectRecruitingStatus = (researchProjectData.recruiting_status)
        ? (
            <Typography.Text
                type={ProjectRecruitingStatus[researchProjectData.recruiting_status].type}
                style={{ color: ProjectRecruitingStatus[researchProjectData.recruiting_status].colour }}
            >
                {ProjectRecruitingStatus[researchProjectData.recruiting_status].label}
            </Typography.Text>
        )
        : (<Typography.Text type="info">Not Set</Typography.Text>);

    // render the contact container only if the project is allowing the contact to be visible
    const contactContainer = (researchProjectData.is_contact_visible && researchProjectData?.contact_name !== '' && researchProjectData?.contact_name)
        ? (
            <>
                <Row align="bottom">
                    <Col>
                        <Attribute title="Contact" content={renderTags([researchProjectData.contact_name])} />
                    </Col>
                    <Col>
                        <div className="email">
                            <Link underline>{researchProjectData.contact_email}</Link>
                        </div>
                    </Col>
                </Row>
            </>
        )
        : null;

    // the cols created for the social media info and website links
    const websiteElement = (researchProjectData.website_link)
        ? (<Attribute title="Study Website:" content={researchProjectData.website_link} />)
        : null;
    const facebookElement = (researchProjectData.facebook_link)
        ? (<Attribute title="Facebook Link:" content={researchProjectData.facebook_link} />)
        : null;
    const instagramElement = (researchProjectData.instagram_link)
        ? (<Attribute title="Instagram Link:" content={researchProjectData.instagram_link} />)
        : null;
    const twitterElement = (researchProjectData.twitter_link)
        ? (<Attribute title="Twitter Link:" content={researchProjectData.twitter_link} />)
        : null;
    const researchGateElement = (researchProjectData.research_gate_link)
        ? (<Attribute title="Research Gate Link:" content={researchProjectData.research_gate_link} />)
        : null;
    const linkedinElement = (researchProjectData.linkedin_link)
        ? (<Attribute title="Linkedin Link:" content={researchProjectData.linkedin_link} />)
        : null;

    const socialMediaElements = [
        websiteElement, facebookElement, instagramElement, twitterElement, researchGateElement, linkedinElement
    ];
    let renderedSocialMediaRows = [];
    let socialMediaPair = [];
    for (let socialMediaCounter = 0; socialMediaCounter < socialMediaElements.length; socialMediaCounter++) {
        if (socialMediaCounter % 2 === 0 && socialMediaCounter !== 0 && socialMediaElements[socialMediaCounter]) {
            socialMediaPair.push(<Col span={8}>socialMediaElements[socialMediaCounter]</Col>);
        } else if (socialMediaElements[socialMediaCounter]) {
            socialMediaPair.push(<Col>socialMediaElements[socialMediaCounter]</Col>);
        }
        if (socialMediaPair.length === 2 || socialMediaCounter === socialMediaElements.length) {
            renderedSocialMediaRows.push((
                <Row className="mt-20 mb-20">
                    {socialMediaPair[0]}
                    {socialMediaPair[1]}
                </Row>
            ));
        }
    }

    const researchProjectInstitutions = researchProjectData.institutions.map(
        facility => (<Title level={5} className="content">{facility}</Title>)
    );

    const researchProjectSummary = (researchProjectData.description && researchProjectData.description !== '')
        ? (
            <Row className="mb-25" style={{ marginTop: '1em' }}>
                <Attribute title="Summary"
                    contentNode={(
                        <Paragraph
                            ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                            style={{ color: 'var(--primary-color-1)' }}
                        >
                            {researchProjectData.description}
                        </Paragraph>
                    )}
                />
            </Row>
        )
        : null;

    return (
        <Col>
            <Row align={'middle'}>
                <Col span={19}>
                    <Title level={3}>
                        <span className="project-title">{researchProjectData.title}</span>
                    </Title>
                </Col>
                <Col span={1} offset={2}>
                    {researchProjectData.is_archived && (
                        <Popover overlayStyle={{maxWidth: '550px'}} content={projectArchivedState} title="Archive Settings" trigger="hover">
                            <FontAwesomeIcon style={{fontSize: '1.7rem', color: '#002E6D'}} icon={solid('box-archive')} />
                        </Popover>
                    )}
                </Col>
                <Col span={1} offset={1}>
                    {<VisibilityStatusIndicator
                        isPublic={researchProjectData.is_public}
                        visibleMessage={"This project is publicly available and can be seen by all Engage Members in the Projects page."}
                        hiddenMessage={"This project is private and is only seen by Team Members from their Home page."}
                    />}
                </Col>
            </Row>

            <br />

            <Row className="attribute-block mb-25" justify="space-between">
                <Attribute title="Project Created:" content={projectCreatedAtDate.toLocaleDateString()} />
                <Attribute title="Project Creator:" content={researchProjectData.creator_name} />
                <Attribute title="Project Lead:" content={researchProjectData.creator_name} />
                <Attribute title="Recruiting Status:" content={researchProjectRecruitingStatus} />
            </Row>

            <Row className="attribute-block mb-25">
                {researchProjectData.is_using_start_date ?
                    <Col style={{ marginRight: '1em' }}>
                        <Attribute title="Estimated Start Date:" content={projectStartDate} />
                    </Col> : ''}
                {researchProjectData.is_using_end_date ?
                    <Col>
                        <Attribute title="Estimated End Date:" content={projectEndDate} />
                    </Col> : ''}
            </Row>

            <Row className="attribute-block mb-25 collapsible" align="bottom" style={compactHiddenStyles}>
                {(projectType !== "Not Set")
                    ? (
                        <Col>
                            <Attribute title="Project Type:" content={<div className="tag">{projectType}</div>} />
                        </Col>
                    )
                    : null}
                <Col span={3} />
                {(projectCentreFormat !== "Not Set")
                    ? (
                        <Col>
                            <Attribute title="Clinical Trials:"
                                content={<div className="tag">{projectCentreFormat}</div>} />
                        </Col>
                    )
                    : null}
            </Row>
            {(projectStudyFormatTags !== "Not Set")
                ? (
                    <Row className="attribute-block mb-25 collapsible" align="bottom" style={compactHiddenStyles}>
                        <Col>
                            <Attribute title="Research study formats:"
                                content={(<div>{projectStudyFormatTags}</div>)}
                            />
                        </Col>
                    </Row>
                )
                : null}
            {researchProjectSummary}
            <Row className="mb-25" justify="space-between">
                <Col className="collapsible" style={compactVisibleStyles}>
                    <div className="compact-attribute-block">
                        {(projectType !== "Not Set")
                            ? (
                                <Title level={5} className="content">
                                    {projectType}
                                </Title>
                            )
                            : null}
                        {(projectStudyFormat !== "Not Set")
                            ? (
                                <Title level={5} className="content">
                                    {projectStudyFormat[0]}
                                </Title>
                            )
                            : null}
                        {(projectCentreFormat !== "Not Set")
                            ? (
                                <Title level={5} className="content">
                                    {projectCentreFormat}
                                </Title>
                            )
                            : null}
                    </div>
                </Col>
            </Row>

            <div className="collapsible mt-20 mb-20" style={compactHiddenStyles}>
                <Row className="mb-25">
                    <Col>
                        <Attribute title="Partners needed:" content={projectPartnersRequired} />
                    </Col>
                    <Col span={6} />
                    <Col>
                        <Attribute title="Project Interests:" content={projectResearchInterests} />
                    </Col>
                </Row>
                {contactContainer}
            </div>

            {/* The rendered social media rows */}
            {renderedSocialMediaRows}

            <Row className="mb-20">
                <Link onClick={handleShowMoreBtn} underline>
                    Show {compact ? 'more' : 'less'}
                </Link>
            </Row>
        </Col>
    );
}
