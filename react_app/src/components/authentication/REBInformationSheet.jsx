import React from "react";
import { Modal, Row, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import {SVGToImageConverter} from "./../utils";
import uOttawaLogo from "./../../imgs/university-of-Ottawa.svg";
import cheoFullLogo from "./../../imgs/cheo-full-logo.svg";
import engageStagingQRCode from "./../../imgs/engage-staging-qr-code.png";

const { Title, Paragraph, Text } = Typography;


export default function REBInformationSheet({ isModalOpen, setIsModalOpen }) {
    const navigate = useNavigate();
    const handleCancelModal = () => navigate('/');
    const handleSubmitModal = () => setIsModalOpen(false);

    return (
        <Modal
            centered={true}
            title={""}
            open={isModalOpen}
            onCancel={handleCancelModal}
            maskClosable={false}
            onOk={handleSubmitModal}
            okText={"Agree"}
            cancelText={"Disagree"}
            cancelButtonProps={{ type: 'danger' }}
            width={1000}
            closable={false}
        >
            <Row align={"middle"} justify={"space-between"} style={rebInformationSheetStyles.logoHeaderContainer}>
                <SVGToImageConverter
                    logo={cheoFullLogo}
                    styleOverride={rebInformationSheetStyles.cheoLogo}
                    alt={"Children Hospital of Eastern Ontario Logo"}
                />
                <SVGToImageConverter
                    logo={uOttawaLogo}
                    styleOverride={rebInformationSheetStyles.uOttawaLogo}
                    alt={"University of Ottawa Logo"}
                />
            </Row>
            <Row align={"middle"} justify={"center"}>
                <Title>Engage Information Sheet</Title>
            </Row>
            <Row>
                <Paragraph>
                    You are being invited to participate in a research study to help us design a website for patient
                    engagement in critical care research in Canada. The goal of this study is to help us design and
                    improve the Engage website.
                </Paragraph>
            </Row>
            <Row>
                <Paragraph>
                    You are being invited because: (1) you were previously admitted to an ICU in Canada, (2) you or a
                    member of your family was previously admitted to an ICU in Canada, or (3) you are a researcher or
                    clinician who focused on critical care in Canada.
                </Paragraph>
            </Row>
            <Row>
                <Paragraph>
                    Taking part in this study is voluntary. Your decision to participate or not in this study will not
                    affect the care you receive at any hospital in Canada, or your employment at any hospital in Canada.
                    You are free to withdraw from the study at any time and there will be no penalty to you or your
                    family. We expect to invite approximately 200 people to participate.
                </Paragraph>
            </Row>
            <Row>
                <Paragraph>
                    <strong>What is expected and how long it would take to complete: </strong>
                    For this study, you would first need to create an account on the Engage website.
                    Once you sign up on the website, you may be invited to participate in a survey and/or to participate in an
                    interview to give your feedback about the website or your experience working with others on the website.
                    As an account member of the Engage website, you may also be invited to participate in different engagement
                    activities and projects hosted by the website. This may include things like: reading study documents and
                    giving your feedback to the research team, helping choose research questions, or helping researchers decide
                    the best way to collect data from patients in a new study. You can choose to participate in as many of these
                    activities as you would like, or you can decide not to participate in any.
                </Paragraph>
            </Row>
            <Row>
                <Paragraph>
                    If you are asked to participate in a survey, the survey will not ask you for any identifying information and will be anonymous.
                    If you are asked to participate an in interview, we will not record any identifying information about you.
                    If we publish or present the study results, we will not use any identifying information about you.
                    We will keep all survey and interview data on a password-protected computer at the CHEO Research Institute or at Algonquin College.
                    Following completion of the research study the data will be kept for 7 years after the last publication of this study.
                    They will then be destroyed.
                </Paragraph>
            </Row>
            <Row>
                <Paragraph>
                    You may be asked in the future to participate in engagement activities, or to participate in a survey or interview on more than one occasion.
                    Participation is always voluntary. You can decide to delete your account on the Engage platform at any time.
                    You can also decide to keep your account, and not participate in any activities or surveys or interviews.
                </Paragraph>
            </Row>
            <Row>
                <Paragraph>
                    You may or may not directly benefit from the study. However, your input and perspective would be of tremendous value to us.
                    We do not anticipate any risks from this study. Once the study is complete, we will share a summary of the study results with
                    all of the participants who are signed up on the Engage website.
                </Paragraph>
            </Row>
            <Row>
                <Paragraph>
                    Your consent will be implied when you sign-up on the Engage website.
                </Paragraph>
            </Row>
            <Row>
                <Paragraph>
                    Please feel free to contact Lisa Albrecht at
                    <a href={"mailto:lalbrecht@cheo.on.ca"}> lalbrecht@cheo.on.ca </a>
                    if you have any questions.
                </Paragraph>
            </Row>
            <Row>
                <Paragraph>
                    Your assistance with this research is greatly appreciated. Thank you for your time and
                    consideration.
                </Paragraph>
            </Row>
            <Row align={"middle"} justify={"center"}>
                <SVGToImageConverter 
                    logo={engageStagingQRCode}
                    styleOverride={rebInformationSheetStyles.engageStagingQRCode}
                    alt={"QR code of engage"}
                />
            </Row>
            <Text type="secondary">Information Letter (v27-Nov-2023)</Text>
        </Modal>
    );
}

const rebInformationSheetStyles = {
    logoHeaderContainer: {
        marginBottom: '1rem',
    },
    cheoLogo: {
        width: '400px',
    },
    uOttawaLogo: {
        width: '100%',
        height: '85px',
    },
    engageStagingQRCode: {
        height: '200px',
        width: '200px',
    },
}
