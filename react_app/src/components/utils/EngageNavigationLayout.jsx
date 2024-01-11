import React, { Suspense } from 'react';
import { Affix, Card, Layout, Row } from "antd";
import { Constants, EngageSpinner } from "./index";
import HeaderHome from "../home/home_header/HeaderHome";
import FooterHome from "../home/home_footer/FooterHome";
import MainNavigation from "../home/MainNavigation";
import { Outlet } from 'react-router-dom';
import { useEngageStylingLayout } from '../../providers/EngageLayoutStylingContextProvider';

const { Footer, Header } = Layout;

export default function EngageNavigationLayout({ itemKey }) {

    const { removePadding, whiteBackground } = useEngageStylingLayout();

    return (
        <Suspense fallback={<EngageSpinner display={"fullscreen"} />}>
            <Header className="nav-header engage-application-header">
                <HeaderHome />
            </Header>
            <MainNavigation selectedMenu={`${itemKey}`} removeLayoutPadding={removePadding}
                whiteBackground={whiteBackground}
            >
                <Outlet />
            </MainNavigation>
            <Footer className="main-footer engage-ic4u-footer">
                <FooterHome />
                <Row
                    align={"bottom"}
                    justify={"center"}
                    style={{ backgroundColor: "#F5F5F5" }}
                >
                    &copy; {Constants.COPYRIGHT}
                </Row>
            </Footer>
        </Suspense>
    );
}
