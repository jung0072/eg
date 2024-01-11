import React from "react";
import { Image, Row, Col, Divider, Space } from "antd";
import {
    TwitterOutlined,
    FacebookFilled,
    InstagramOutlined,
    LinkedinFilled,
} from "@ant-design/icons";
import "./footer_home.css";
import engageIC4ULogo from "../../../imgs/engage-black-logo.svg";
import { Link, useNavigate } from "react-router-dom";
import { Constants } from "../../utils";
import CCCTGLogo from '../../../imgs/ccctg-logo.png';
import CHEOLogo from '../../../imgs/cheo-logo.svg';
import AlgonquinCollegeLogo from '../../../imgs/algonquin-college-logo-minified.svg';
import SlideLogo from '../../../imgs/slide-logo.svg';
import NoNLogo from '../../../imgs/non-logo.png';

/**
 *
 * @returns The content of the footer component
 * @todo add Links to the pages for dropdown
 */
const FooterNavItems = () => {
    return (
        <Row
            justify={"space-between"}
            align={"center"}
            wrap={false}
            style={{ width: "100%" }}
        >
            {Constants.FOOTER_ITEMS.map((data, index) => {
                return (
                    <React.Fragment key={data.key}>
                        <Link to={data.link} className="footer-quick-links">
                            <div align={"center"}>{data.label}</div>
                        </Link>
                        {index !== Constants.FOOTER_ITEMS.length - 1 ? (
                            <div
                                align={"center"}
                                style={{
                                    backgroundColor: "black",
                                    width: "1.5px",
                                    height: "25px",
                                }}
                            />
                        ) : null}
                    </React.Fragment>
                );
            })}
        </Row>
    );
};

function FooterHome() {
    const navigate = useNavigate();
    const commonImageProps = {
        width: '60px',
        preview: false
    };
    return (
        <Row justify={"space-between"}>
            <Col span={3}>
                <Image
                    preview={false}
                    src={engageIC4ULogo}
                    alt={"The Logo of the Engage Platform"}
                    onClick={() => navigate('/home/')}
                    style={{
                        width: "150px",
                        height: "32px",
                        fill: "black",
                    }}
                />
            </Col>
            <Col span={12} wrap={false}>
                <FooterNavItems />
            </Col>
            <Col span={3}>
                <Space size={['middle']} align={'end'} style={{ width: '80%', justifyContent: 'flex-end' }}>
                    <Image
                        className={'social-icon-footer'}
                        src={CCCTGLogo}
                        alt={"The logo from CCCTG (Canadian Critical Care Trials Group)"}
                        style={{
                            marginLeft: 'auto',
                            filter: 'brightness(0) saturate(100%)',
                            top: '9px',
                            position: 'relative'
                        }}
                        {...commonImageProps}
                    />
                    <Image
                        className={'social-icon-footer'}
                        src={CHEOLogo}
                        style={{ filter: 'brightness(0) saturate(100%)' }}
                        alt={"The logo from CHEO (Children's Hospital of Eastern Ontario)"}
                        {...commonImageProps}
                    />
                    <Image
                        className={'social-icon-footer'}
                        src={AlgonquinCollegeLogo}
                        style={{ filter: 'brightness(0) saturate(100%)' }}
                        alt={"The logo from the Algonquin College"}
                        {...commonImageProps}
                    />
                </Space>
            </Col>
        </Row>
    );
}

export default React.memo(FooterHome);
