import React, { useState, useEffect, useContext } from "react";
import { Alert, Col, Row } from "antd";
import RecentResearchTaskCard from "../components/home/home_content/RecentResearchTaskCard.jsx";
import ProjectListScreen from "./ProjectListScreen.jsx";
import UserRecentMessageTags from "../components/home/home_content/UserRecentMessageTags.jsx";
import { selectLoggedInUserData } from "../redux/services/userAPI.js";
import '../css/home_page.css';
import { EngageSpinner } from "../components/utils";
import { useSelector } from "react-redux";
import { pendingUserProfileCheckMessage } from "../components/utils/constants.strings";
import { useEngageStylingLayout } from "../providers/EngageLayoutStylingContextProvider.jsx";
import { SelectedResearchProjectContext } from "../providers/SelectedResearchProjectContextProvider";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { MENU_ROUTES } from "../components/utils/constants";

export default function HomePage() {
    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();


    // for testing print user data will be removed before merge
    const userData = useSelector(selectLoggedInUserData);
    const [userAlert, setUserAlert] = useState(null);
    const { selectedResearchProject } = useContext(SelectedResearchProjectContext);
    const [selectedProject, setSelectedProject] = useState(selectedResearchProject);
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);

    // useEffect hook that will detect this screen being loaded and will run the following functions to modify
    // the layout and the current navigation
    useEffect(() => {
        // remove the padding
        removeLayoutPadding(true);
        // remove the white background color
        changeBackgroundColor(false);
        //set the active menu to the home page
        updateActiveNavigationMenu(MENU_ROUTES[1].key);
    }, []);

    // useEffect hook to detect changes for the selected researchProject that will re-render the recent tasks/ tags
    // based on what is selected from the research project table
    useEffect(() => setSelectedProject(selectedResearchProject), [selectedResearchProject, setSelectedProject]);

    useEffect(() => {
        if (userData) {
            // if the user has not completed their profile check then display the banner to instruct them to fill out the profile
            const { is_profile_complete: isProfileComplete } = userData.user;
            const userPendingApprovalAlert = (isProfileComplete)
                ? null
                : (
                    <Row style={{ marginBottom: '1em' }}>
                        <Alert
                            message={(<strong>Welcome to 'Engage'</strong>)}
                            description={pendingUserProfileCheckMessage}
                            type="info"
                            closable={true}
                        />
                    </Row>
                );
            setUserAlert(userPendingApprovalAlert);
        }
    }, [userData]);

    if (!userData) {
        return (<EngageSpinner loaderText={"Loading home page"} display="fullscreen" />);
    }
    return (
        <>
            {userAlert}
            <div className={'home-page-screen'} style={{ padding: '20px 30px' }}>
                <Row gutter={[16]}>
                    <Col span={18}>
                        <Row align={"middle"} justify="space-between">
                            <Col span={24}>
                                <Row className="header-welcome">
                                    Welcome back!
                                </Row>
                                <Row className="header-name">
                                    {userData.user.full_name}
                                </Row>
                            </Col>
                        </Row>
                        <Row>
                            <RecentResearchTaskCard researchProjectID={selectedProject.id} />
                        </Row>
                        <Row>
                            <ProjectListScreen isHome={true} />
                        </Row>
                    </Col>
                    <Col
                        span={6}
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            flexDirection: "column",
                        }}
                    >
                        <Row wrap={true}>
                            <UserRecentMessageTags researchProjectID={selectedProject.id} />
                        </Row>
                    </Col>
                </Row>
            </div>
        </>
    );
}
