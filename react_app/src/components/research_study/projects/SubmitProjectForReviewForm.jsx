import { Button, Layout, Typography, Row, Col } from "antd";
import { CheckCircleOutlined, InfoCircleFilled, WarningOutlined } from "@ant-design/icons";
import React, { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { openNotification, renderFormErrors } from "../../utils";
import { PRIMARY_1 } from "../../utils/colors";

const { Title, Paragraph, Text } = Typography;

export default function SubmitProjectForReviewForm({ researchProjectData, mutationTrigger }) {
    const { id: researchProjectID } = useParams();
    const [hasClickedSubmitForReview, setHasClickedSubmitForReview] = useState(false);

    const handleSubmitForReviewClick = useCallback(() => {
        setHasClickedSubmitForReview(true);
        mutationTrigger({ id: researchProjectID, submit_for_review: true }).then(({ data, error }) => {
            if (error) {
                renderFormErrors(error, null, "Error submitting research project for approval!");
            } else {
                // show the user a notification on save and then navigate them to the next page after a few seconds
                openNotification({
                    message: "Submitted Research Project for Approval",
                    description: `You have submitted the research project ${data.title} for approval. Wait for an update from the admins about the status of your project`,
                    placement: 'topRight',
                    icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                });
            }
        }).catch(console.error);
    }, [mutationTrigger, researchProjectData, setHasClickedSubmitForReview]);

    // create the submit for review button, if the project is ready for review, show either a check or an info
    // icon, but if the project is approved, do not show the button
    const submitForReviewBtn = (researchProjectData?.is_approved)
        ? (
            <Button type="primary" icon={<CheckCircleOutlined />} disabled={true}>
                Approved
            </Button>
        )
        : (
            <Button type="primary" onClick={handleSubmitForReviewClick}
                icon={(researchProjectData?.is_ready_for_review) ? <InfoCircleFilled /> : <WarningOutlined />}
                disabled={researchProjectData?.is_ready_for_review || hasClickedSubmitForReview}
            >
                {
                    (researchProjectData?.is_ready_for_review)
                        ? "Pending Approval"
                        : (!hasClickedSubmitForReview) ? "Submit for Review" : "Submitted for Review"
                }
            </Button>
        );

    return (
        <>
            <Layout style={submitForReviewStyles.container}>
                <Row>
                    <Title level={3}>Submit Project for Admin Approval</Title>
                </Row>
                <Row>
                    <Paragraph>
                        Your project will be submitted for admin approval. You may edit project details, add tasks, and
                        add calendar events while approval is pending. Your project is only viewable by you and website
                        admins, so you cannot yet invite team members. After it is approved, your project will be
                        viewable by the community, and members can join or be invited.
                    </Paragraph>
                </Row>
                {/* Rows for Basic Project Details for Review */}
                <Row>
                    <Title level={4}>Project Details</Title>
                </Row>
                <Col>
                    <Row>
                        <Text>
                            <span style={submitForReviewStyles.label}>Project Title: </span>
                            {researchProjectData.title}
                        </Text>
                    </Row>
                    <Row>
                        <Text>
                            <span style={submitForReviewStyles.label}>Reference Name: </span>
                            {researchProjectData.reference_name}
                        </Text>
                    </Row>
                    <Row>
                        <Text>
                            <span style={submitForReviewStyles.label}>Project Creator: </span>
                            {researchProjectData.creator_name}
                        </Text>
                    </Row>
                    <Row>
                        <Text>
                            <span style={submitForReviewStyles.label}>Project Leads: </span>
                            {researchProjectData.project_leads}
                        </Text>
                    </Row>
                    <Row>
                        <Text>
                            <span style={submitForReviewStyles.label}>Alternate Contact: </span>
                            {
                                (researchProjectData.contact_email)
                                    ? `${researchProjectData.contact_name} (${researchProjectData.contact_email})`
                                    : 'None'
                            }
                        </Text>
                    </Row>
                </Col>
                <Row style={{ marginTop: '1em' }}>
                    {submitForReviewBtn}
                </Row>
            </Layout>
        </>
    );
}

const submitForReviewStyles = {
    container: {
        backgroundColor: '#FAFAFA',
        borderRadius: '15px',
        padding: '1em',
        fontFamily: 'Inter',
        color: '#25282B',
    },
    title: {
        fontSize: '16px',
        fontWeight: 600
    },
    label: {
        color: PRIMARY_1,
        fontWeight: 700
    }
};
