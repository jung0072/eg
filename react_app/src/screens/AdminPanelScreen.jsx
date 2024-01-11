import React, { useContext, useEffect, useState } from "react";
import { Col, Layout, Tooltip } from "antd";
import AdminPanelHome from "../components/admin_panel/AdminPanelHome.jsx";
import { LeftOutlined } from "@ant-design/icons";
import "../components/admin_panel/admin_panel_screen.css";
import { PRIMARY_1 } from "../components/utils/colors.jsx";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { setAdminPanelValue } from "../redux/slicers/adminPanelSlice.js";
import {
    useGetAllResearchProjectDataQuery,
    useGetPendingResearchersQuery, useGetResearchInterestCategoriesQuery, useGetResearchInterestOptionsQuery,
    useGetSystemUsersQuery,
    usePendingResearchProjectsQuery, useUserProfileQuestionsQuery
} from "../redux/services/adminAPI.js";
import { useEngageStylingLayout } from '../providers/EngageLayoutStylingContextProvider.jsx';
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { MENU_ROUTES } from "../components/utils/constants";

const { Content } = Layout;

export default function AdminPanelScreen() {
    const dispatch = useDispatch();

    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);

    const [activeCard, setActiveCard] = useState(null);

    const { data: pendingResearchers, isLoading: loadingResearchers } =
        useGetPendingResearchersQuery();
    dispatch(setAdminPanelValue({ id: 2, value: pendingResearchers?.length }));

    const { data: systemUsersData } = useGetSystemUsersQuery();
    if (systemUsersData) {
        dispatch(setAdminPanelValue({ id: 4, value: systemUsersData.length }));
    }

    const { data: pendingResearchProjects } = usePendingResearchProjectsQuery();
    if (pendingResearchProjects) {
        dispatch(
            setAdminPanelValue({ id: 1, value: pendingResearchProjects.length })
        );
    }

    const { data: allResearchProjects } = useGetAllResearchProjectDataQuery();
    if (allResearchProjects) {
        dispatch(
            setAdminPanelValue({ id: 3, value: allResearchProjects.length })
        );
    }

    const { data: userProfileQuestionData, } = useUserProfileQuestionsQuery();
    if (userProfileQuestionData) {
        dispatch(
            setAdminPanelValue({ id: 6, value: userProfileQuestionData['questions'].length })
        );
    }

    const { data: researchInterestCategories } = useGetResearchInterestCategoriesQuery();
    if (researchInterestCategories) {
        dispatch(
            setAdminPanelValue({ id: 8, value: researchInterestCategories.length })
        );
    }

    const adminPanelComponent = useSelector(
        (state) => state.adminPanel.adminPanelComponent
    );

    const handleClick = (card) => {
        setActiveCard(card.id);
    };

    function handleBackButton() {
        setActiveCard(null);
    }

    // useEffect hook for component did mount
    useEffect(() => {
        // remove the padding
        removeLayoutPadding(false);
        // remove the white background color
        changeBackgroundColor(false);
        // set the active menu context to the admin panel screen
        updateActiveNavigationMenu(MENU_ROUTES[0].key);

        // Check if there is an active card in the session storage
        // This is used to render the AdminPanelHome after a page refresh
        const activeCard = sessionStorage.getItem('activeCard');
        if (activeCard) {
            // set the active card after a timeout to avoid a rendering issue
            setTimeout(() => {
                setActiveCard(activeCard);
            });
            sessionStorage.removeItem('activeCard');
        }
    }, []);

    const displayedPanel = (activeCard)
        ? (
            <AdminPanelHome activeCard={activeCard} />
        )
        : null;

    const backButton = (activeCard)
        ? (
            <div
                onClick={handleBackButton}
                style={adminPanelScreenStyles.back_button}
            >
                <LeftOutlined
                    style={{
                        fontSize: "2.5em",
                        color: PRIMARY_1,
                    }}
                />
            </div>
        )
        : null;
    return (
        <Layout className={"engage-admin-node"}>
            <Content>
                <div
                    className={`${activeCard ? "seperate-container" : "single-container"}`}
                >
                    {/* render component specific to the card; will be rendered only if a card is clicked */}
                    {displayedPanel}

                    {/* render the cards */}
                    <div
                        className={`${activeCard ? "active-card-container" : "card-container"}`}
                    >
                        {backButton}
                        {adminPanelComponent.map((cardData) => (
                            <Tooltip
                                key={`admin-card-${cardData.id}`}
                                placement="left"
                                title={activeCard ? cardData.title : null}
                            >
                                <Col
                                    key={cardData.id}
                                    style={{
                                        borderColor:
                                            activeCard === cardData.id
                                                ? "#002E6D"
                                                : "inherit",
                                        backgroundColor:
                                            activeCard === cardData.id
                                                ? "#002E6D"
                                                : "",
                                    }}
                                    className={`card ${activeCard ? "active circle" : ""
                                    } ${activeCard ? "move" : ""}`}
                                    onClick={() => handleClick(cardData)}
                                >
                                    <div>
                                        <FontAwesomeIcon
                                            icon={cardData.icon}
                                            style={{
                                                fontSize: "2em",
                                                color:
                                                    activeCard ===
                                                    cardData.id
                                                        ? "white"
                                                        : "inherit",
                                            }}
                                        />
                                    </div>
                                    <div className="card-content">
                                        <div className="card-value">
                                            {cardData.value}
                                        </div>
                                        <div className="card-title">
                                            {cardData.title}
                                        </div>
                                        <p className="card-description">
                                            {cardData.description}
                                        </p>
                                    </div>
                                </Col>
                            </Tooltip>
                        ))}
                    </div>
                </div>
            </Content>
        </Layout>
    );
}

const adminPanelScreenStyles = {
    back_button: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "50px",
        width: "50px",
        borderRadius: "50%",
        backgroundColor: "#FFFFFF",
        boxShadow: "0px 0px 8px #717171",
        cursor: "pointer",
    },
};
