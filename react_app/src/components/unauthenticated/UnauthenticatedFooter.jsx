import FooterHome from "../home/home_footer/FooterHome";
import { Row } from "antd";
import { Constants } from "../utils";
import { Footer } from "antd/lib/layout/layout";
import React from "react";

export const UnauthenticatedFooter = ({ isPinnedToBottom = false }) => {
    return (
        <Footer
            className="main-footer engage-ic4u-footer"
            style={(isPinnedToBottom) ? { position: 'absolute', bottom: 0, left: 0, right: 0 } : {}}
        >
            <FooterHome />
            <Row
                align={"bottom"}
                justify={"center"}
                style={{ backgroundColor: "#F5F5F5" }}
            >
                &copy; {Constants.COPYRIGHT}
            </Row>
        </Footer>
    );
};
