import React, { useContext, useEffect } from "react";
import { Col, Row } from "antd";
import "../components/research_study/projects/user_projects.css";

import { ResearchProjectTable } from "../components/research_study";
import { PlusOutlined } from "@ant-design/icons";

import { selectLoggedInUserData } from '../redux/services/userAPI';
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { EngageSpinner } from "../components/utils";
import { useEngageStylingLayout } from "../providers/EngageLayoutStylingContextProvider";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { MENU_ROUTES } from "../components/utils/constants";

export default function ProjectListScreen({ isHome = false }) {
    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);

    const navigate = useNavigate();
    const userData = useSelector(selectLoggedInUserData);

    // useEffect hook for the component did mount lifecycle event
    useEffect(() => {
        // remove the padding
        removeLayoutPadding(false);
        // remove the white background color
        changeBackgroundColor(false);
        // set the active nav menu to the research projects page
        updateActiveNavigationMenu((isHome) ? MENU_ROUTES[1].key : MENU_ROUTES[3].key);
    }, []);

    if (!userData) {
        return (<EngageSpinner display="fullscreen" loaderText={"Loading Research Project Data"} />);
    }

    const createProjectButton = (userData.user.is_researcher)
        ? (
            <Col>
                <button className="create-project" onClick={() => navigate("/app/research_study_form/")}>
                    <PlusOutlined style={{ fontSize: "13px" }} /> Create Project
                </button>
            </Col>
        )
        : null;


    return (
        <Col span={22}>
            <Row justify={"space-between"}>
                <Col className="myproject-title">
                    {isHome ? "My Research Projects" : "Research Projects"}
                </Col>
                {createProjectButton}
            </Row>
            <Row>
                <ResearchProjectTable isHome={isHome ? isHome : false} />
            </Row>
        </Col>
    );
}
