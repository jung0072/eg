import React from 'react';
import { Row, Col, Layout, Typography, Image } from "antd";
import CCCTGLogo from '../../imgs/ccctg-logo.png';
import CHEOLogo from '../../imgs/cheo-logo.svg';
import SlideLogo from '../../imgs/slide-logo.svg';
import NoNLogo from '../../imgs/non-logo.png';

const { Title, Text, Paragraph } = Typography;

export default function AboutUs({}) {

    const commonImageProps = {
        width: '150px',
        preview: false
    };

    return (
        <Layout className={"about-us-container"}>
            <Row>
                <Title level={4} strong={true}>What is UNITE-ICU: Engage?</Title>
            </Row>
            <Row>
                <Paragraph>
                    This platform was designed as a research project to develop an online community to allow patients
                    and their family members to partner with health researchers. Our goal is to connect health
                    researchers with patients, not as study subjects, but as partners to guide health research and
                    clinical care to focus on the aspects that matter most to patients and families. This platform was
                    developed with the input and participation of a diverse group of communities, to ensure inclusivity
                    and accessibility for all Canadians.
                </Paragraph>
            </Row>
            <Row>
                <Title level={4} strong={true}>Who are we?</Title>
            </Row>
            <Paragraph>
                UNITE-ICU: Engage is a project collaboration between the Social Innovation Lab (SLiDE) at Algonquin
                College, the Children’s Hospital of Eastern Ontario (CHEO), and the Canadian Critical Care Trials Group
                (CCCTG), and the COVID-19 Network of Clinical Trials Network (NoN).
            </Paragraph>
            <Row>
                <Title level={4} strong={true}>Funders</Title>
            </Row>
            <Row>
                <Paragraph>
                    Funding generously provided by the AHSC AFP Innovation Fund, CHAMO, and the COVID-19 Network of
                    Clinical Trials Network (NoN).
                </Paragraph>
            </Row>
            <Row gutter={[16]}>
                <Col span={6} style={aboutUsStyles.imageContainer}>
                    <Image
                        src={SlideLogo}
                        alt={"The logo from the SLiDE Lab (Social Innovation Lab)"}
                        {...commonImageProps}
                    />
                </Col>
                <Col span={6} style={aboutUsStyles.imageContainer}>
                    <Image
                        src={CHEOLogo}
                        alt={"The logo from CHEO (Children's Hospital of Eastern Ontario)"}
                        {...commonImageProps}
                    />
                </Col>
                <Col span={6} style={aboutUsStyles.imageContainer}>
                    <Image
                        src={CCCTGLogo}
                        alt={"The logo from CCCTG (Canadian Critical Care Trials Group)"}
                        {...commonImageProps}
                    />
                </Col>
                <Col span={6} style={aboutUsStyles.imageContainer}>
                    <Image
                        src={NoNLogo}
                        alt={"The logo from Network of Networks (COVID-19 Network of Clinical Trials Networks)"}
                        {...commonImageProps}
                    />
                </Col>
            </Row>
        </Layout>
    );
}

const aboutUsStyles = {
    imageContainer: {
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center'
    }
};
