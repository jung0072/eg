import React, { useContext, useEffect } from 'react';
import '../components/research_study/project_details/projectDetails.css';
import { ProjectDetailsMemberView } from '../components/research_study/';
import { useParams } from "react-router-dom";
import { useResearchProjectInfoQuery } from '../redux/services/researchProjectAPI';
import { EngageSpinner, EngageActionButton, ReportItem } from "../components/utils";
import { useSelector } from "react-redux";
import { selectLoggedInUserData } from "../redux/services/userAPI";
import ResearchProjectBreadcrumbs from "../components/research_study/projects/ResearchProjectBreadcrumbs";
import { Alert, Row, Col } from "antd";
import {
    pendingProjectApprovalMessage, pendingSubmissionForApprovalMessage
} from "../components/utils/constants.strings";
import { useEngageStylingLayout } from '../providers/EngageLayoutStylingContextProvider';
import ResearchProjectToolMenu from '../components/research_study/project_details/ResearchProjectToolMenu';
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { MENU_ROUTES } from "../components/utils/constants";

export default function () {
    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);

    // after getting the project id from the route, make a request for the research project data
    // and after loading it send it to ProjectDetailsMemberView component
    const { id: researchProjectID } = useParams();
    const userData = useSelector(selectLoggedInUserData);
    const {
        data: researchProjectData,
        isSuccess,
        isLoading,
        isError,
        error
    } = useResearchProjectInfoQuery(researchProjectID);

    // useEffect hook for the component did mount lifecycle event
    useEffect(() => {
        // remove the padding
        removeLayoutPadding(false);
        // remove the white background color
        changeBackgroundColor(false);
        // set the active nav menu to the research projects page
        updateActiveNavigationMenu(MENU_ROUTES[3].key)
    }, []);

    if (isLoading) {
        return (
            <div style={researchProjectStyles.loaderContainer}>
                <EngageSpinner loaderText={"Loading Research Project Data"} display={'area'} />
            </div>);
    }

    if (!researchProjectData) {
        return (<div className={'project-details-wrapper'}>Could not load research project data</div>);
    }

    // TODO(Rahib): Confirm this if we want to show all user (active or not) when creating task
    // TODO(Rahib): if yes, should we also include the invited user via email (not on platform)
    // or wait for them to fill out their details and then include them, currently hiding them here.
    const active_members = researchProjectData.study_team
        .filter((user) => user.full_name.trim() !== "")
        .map((data) => {
            return {
                value: data.user_id,
                label: data.full_name,
                role: data.role,
            };
        });
    const projectApprovalAlert = (!researchProjectData?.is_approved)
        ? (researchProjectData?.is_ready_for_review) ? (
            <Alert
                message={"Pending Admin Approval"}
                description={pendingProjectApprovalMessage}
                type="info"
                closable={true}
            />
        ) : (<Alert
                message={"Pending Submission for Approval"}
                description={pendingSubmissionForApprovalMessage}
                type="info"
                closable={true}
            />
        ) : null;

    const toolMenu = (researchProjectData?.user_permissions && researchProjectData?.user_permissions?.is_active)
        ? (
            <ResearchProjectToolMenu researchProjectData={researchProjectData} />
        )
        : null;


    return (
        <>
            <Row align={"middle"}>
            <Col span={22}>
                <ResearchProjectBreadcrumbs researchProjectData={researchProjectData} />
            </Col>
            <Col offset={1} span={1}>
                <EngageActionButton
                    engageActionStyle={researchProjectStyles.engageActionStyle}
                    itemID={researchProjectData.id}
                    type={"PROJECT"}
                    actionComponent={
                        <ReportItem
                            reportData={{ id: researchProjectData.id, type: "PROJECT" }}
                        />
                    }
                />
            </Col>
            </Row>
            {projectApprovalAlert}
            <Row>
                <Col span={19} id="project-details" className="project-details-wrapper">
                    <ProjectDetailsMemberView researchProjectData={researchProjectData} activeMembers={active_members}
                        currentUser={userData}
                    />
                </Col>
                <Col span={5}>
                    {toolMenu}
                </Col>
            </Row>
        </>
    );
}

const researchProjectStyles = {
    loaderContainer: {
        width: '100%',
        height: '100%'
    },
    engageActionStyle: {
        reportIconStyle: {
            fontSize: '1.5rem',
        }
    }
};
