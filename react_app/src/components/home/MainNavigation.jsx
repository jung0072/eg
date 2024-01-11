import React, { memo, useEffect, useState, useContext } from "react";
import { Affix, Layout, Menu } from "antd";
import {
    HomeOutlined,
    InfoCircleOutlined,
    MessageOutlined,
    TeamOutlined,
    FileSearchOutlined,
    BugOutlined,
    WarningOutlined
} from "@ant-design/icons";
import "./home.css";
import { Outlet, useNavigate } from "react-router-dom";
import { Constants, EngageSpinner, getItemAntDMenu } from "../utils/";
import { selectLoggedInUserData } from "../../redux/services/userAPI.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSatellite } from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";
import { selectUserProfileCheck, userAPI } from '../../redux/services/userAPI';
import store from "../../redux/store";
import { ActiveNavigationMenuContext } from "../../providers/ActiveNavigationMenuContextProvider";

const { MENU_ROUTES } = Constants;
const { Sider, Content } = Layout;

const DEFAULT_MENU_ITEMS = [
    getItemAntDMenu("Home", "1", <HomeOutlined />),
    { type: "divider" },
    getItemAntDMenu("Community", "2", <TeamOutlined />),
    { type: "divider" },
    getItemAntDMenu("Research Projects", "3", <FileSearchOutlined />),
    { type: "divider" },
    getItemAntDMenu("Message Centre", "4", <MessageOutlined />),
    { type: "divider" },
    getItemAntDMenu("About Us", "5", <InfoCircleOutlined />),
    { type: "divider" },
];

function MainNavigation(
    {
        children,
        sideContent,
        selectedMenu,
        removeLayoutPadding = false,
        whiteBackground = false
    }
) {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([...DEFAULT_MENU_ITEMS]);
    const { updateActiveNavigationMenu, activeNavigationMenu } = useContext(ActiveNavigationMenuContext);

    const userData = useSelector(selectLoggedInUserData);
    const userProfileCompletionCheck = useSelector(selectUserProfileCheck);

    // protected key in side nav, set the nav key here
    const minimumReqNavKey = ["2", "3", "4"];
    const [loading, setLoading] = useState(false);

    // if we were supplied sideContent elements we can place them inside a Sider to
    // place in right of the content
    const sideContentElement = sideContent ? <Sider>{sideContent}</Sider> : null;

    useEffect(() => {
        if (userData) {
            if (userData.user.is_admin) {
                // first add the quick link for the admin page
                const adminObject = getItemAntDMenu("Admin", "0", <FontAwesomeIcon icon={faSatellite} />);
                const adminIndex = menuItems.findIndex(obj => obj.key === adminObject.key);

                // next add the quick link for the system issues page
                const systemIssuesObject = getItemAntDMenu("System Issues", "6", <BugOutlined />);
                const engageReportsObject = getItemAntDMenu("Engage Reports", "7", <WarningOutlined />);
                const issuesIndex = menuItems.findIndex(obj => obj.key === systemIssuesObject.key);

                if (adminIndex === -1 && issuesIndex === -1) {
                    setMenuItems([
                        adminObject, { type: "divider" }, 
                        systemIssuesObject, { type: "divider" }, 
                        engageReportsObject, {type: "divider"}, 
                        ...DEFAULT_MENU_ITEMS
                    ]);
                }
            } else {
                setMenuItems([...DEFAULT_MENU_ITEMS]);
            }
        }
        if (!userProfileCompletionCheck) {
            setLoading(true);
            store.dispatch(
                userAPI.endpoints.checkUserProfileCompletion.initiate()
            );
        } else {
            setLoading(false);
            const check = userProfileCompletionCheck.error; // check if user fulfills the minimum requirement criteria
            if (check) {
                const updatedMenuItems = menuItems.filter((item) => {
                    return !minimumReqNavKey.includes(item.key);
                });
                setMenuItems(updatedMenuItems);
            }
        }
    }, [userData, setMenuItems, userProfileCompletionCheck]);

    if (loading || !userProfileCompletionCheck) {
        return (<EngageSpinner display="fullscreen" loaderText="Checking profile requirements..." />);
    }


    const onSelectorMenu = (item) => {
        // Update the activeNavigationMenu in the context provider
        updateActiveNavigationMenu(item.key);

        // Check which menu item was clicked on and then navigate to the corresponding path
        for (let x = 0; x <= MENU_ROUTES.length; x++) {
            if (item.key === MENU_ROUTES[x].key && window.location.pathname !== MENU_ROUTES[x].path) {
                const path = MENU_ROUTES[x].path;
                return navigate(path);
            }
        }
    };

    // check if we have any of the extra options supplied for modify the class name of the layout element to override
    // ant-d styles
    const layoutPaddingClass = (removeLayoutPadding) ? "hide-ant-layout-padding" : '';
    const backgroundColorClass = (whiteBackground) ? 'ant-layout-white-background' : '';
    // Hide the padding on the layout based on the supplied props
    return (
        <Layout className={
            `engage-application-navigation ${layoutPaddingClass} ${backgroundColorClass}`
        }>
            <Affix style={{ display: 'flex', flexWrap: 'wrap' }}>
                <Sider className="navigation">
                    <Menu
                        className="navigation menu-items"
                        selectedKeys={[activeNavigationMenu]}
                        mode="inline"
                        items={menuItems}
                        onClick={onSelectorMenu}
                    />
                </Sider>
            </Affix>
            <Layout style={{ position: "relative" }}>
                <Content style={{ padding: "20px 30px" }}>
                    <Outlet />
                    {sideContentElement}
                </Content>
            </Layout>
        </Layout>
    );
}

export default memo(MainNavigation);
