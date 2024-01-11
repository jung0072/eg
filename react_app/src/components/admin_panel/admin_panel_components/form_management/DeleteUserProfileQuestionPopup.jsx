import React, { useCallback } from 'react';
import ModalPopup from "../../../utils/ModalPopup";
import { Row, Typography, Col, Space } from "antd";

const { Title, Text } = Typography;

const getQuestionRoles = (question) => {
    const applicableRoles = [];
    if (question.is_required_researcher) {
        applicableRoles.push('Researchers/ Clinicians');
    }
    if (question.is_required_patient) {
        applicableRoles.push('Patients');
    }
    if (question.is_required_family_of_patient) {
        applicableRoles.push('Caretakers/ Family of Patients');
    }
    if (question.is_required_passive) {
        applicableRoles.push('Passive Users');
    }
    return applicableRoles.join(', ');
};

export function DeleteUserProfileQuestionPopup(
    {
        handleDeleteUserProfileQuestion,
        isVisible,
        recordToDelete,
        setDeleteRequest
    }
) {
    const handleDeleteQuestion = useCallback(() => {
        handleDeleteUserProfileQuestion();
        setDeleteRequest({ record: null, visible: false });
    }, [recordToDelete, handleDeleteUserProfileQuestion]);
    if (!recordToDelete) {
        return;
    }

    const textForResearchers = (recordToDelete.text_for_researcher)
        ? (
            <>
                <Row><strong>Text for Researchers/ Clinicians: </strong></Row>
                <Row>{recordToDelete.text_for_researcher}</Row>
            </>
        )
        : null;

    const textForPatients = (recordToDelete.text_for_patient)
        ? (
            <>
                <Row><strong>Text for Patients: </strong> </Row>
                <Row>{recordToDelete.text_for_patient}</Row>
            </>
        )
        : null;

    const textForCaretakers = (recordToDelete.text_for_caretaker_of_patient)
        ? (
            <>
                <Row><strong>Text for Caretakers of Patients: </strong></Row>
                <Row>{recordToDelete.text_for_family_of_patient}</Row>
            </>
        )
        : null;

    const textForFamily = (recordToDelete.text_for_family_of_patient)
        ? (
            <>
                <Row><strong>Text for Family of Patients: </strong></Row>
                <Row>{recordToDelete.text_for_caretaker_of_patient}</Row>
            </>
        )
        : null;
    return (
        <ModalPopup
            title={"Confirmation to Delete User Profile Question"}
            visible={isVisible}
            handleCancel={() => setDeleteRequest(previous => ({ ...previous, visible: false }))}
            handleOk={handleDeleteQuestion}
            disableScreenTouch={true}
            footerButton="Delete Question"
            type="info"
            centered={true}
            width={750}
        >
            <Row>
                <Title level={4}>Would you like to delete this user profile question?</Title>
            </Row>
            <Row>
                <Col span={24}>
                    <Space direction="vertical">
                        <Row><strong>Question ID: </strong></Row>
                        <Row>{recordToDelete.id}</Row>
                        {textForResearchers}
                        {textForPatients}
                        {textForCaretakers}
                        {textForFamily}
                        <Row><strong>This question is applicable for the following roles:</strong></Row>
                        <Row>{getQuestionRoles(recordToDelete)}</Row>
                    </Space>
                </Col>
            </Row>
        </ModalPopup>
    );
}
