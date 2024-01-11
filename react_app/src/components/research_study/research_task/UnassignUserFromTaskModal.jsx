import { Col, Row } from "antd";
import { reviewAdminUnassignUserDetailMessage, reviewUnassignUserDetailMessage } from "../../utils/constants.strings";
import ModalPopup from "../../utils/ModalPopup";
import React from "react";

export const UnassignUserFromTaskModal = (
    {
        isUnassignModalVisible,
        handleUnassignMember,
        setIsUnassignModalVisible,
        isLoadingMemberDeletion,
        modalStyles,
        unassignModalData,
        userFileList,
        researchTask
    }
) => {
    return (
        <ModalPopup
            title="Unassign User"
            visible={isUnassignModalVisible}
            handleOk={handleUnassignMember}
            handleCancel={() => setIsUnassignModalVisible(false)}
            type="info"
            disableScreenTouch={true}
            footerButton={unassignModalData.userDetail.user_id !== researchTask.user_permissions.user_id
                ? "Unassign User"
                : "Unassign Myself"
            }
            loadingState={isLoadingMemberDeletion}
            centered={true}
            width={750}
        >
            <Row align={'center'}>
                <h1 style={modalStyles.warningTitle}>Warning!</h1>
                <h2 style={modalStyles.userDeleteTitle}>
                    {unassignModalData.userDetail.user_id === researchTask.user_permissions.user_id
                        ? reviewUnassignUserDetailMessage
                        : reviewAdminUnassignUserDetailMessage
                    }
                </h2>
            </Row>
            {unassignModalData.userDetail.user_id !== researchTask.user_permissions.user_id ? (
                <Row>
                    <Col span={12}><span style={modalStyles.fieldName}>User Name: </span> <span
                        style={modalStyles.fieldValue}>{unassignModalData.userDetail.name}</span>
                    </Col>
                    <Col span={12}><span style={modalStyles.fieldName}>Role: </span> <span
                        style={modalStyles.fieldValue}>{unassignModalData.userDetail.role}</span>
                    </Col>
                    <Col span={24}><span style={modalStyles.fieldName}>Task Status: </span>
                        <span style={modalStyles.fieldValue}>
                            {unassignModalData.userDetail.is_complete_value ? "Completed" : "Incomplete"}
                        </span>
                    </Col>
                    {unassignModalData.userDetail.comments ?
                        <Col span={24}><span style={modalStyles.fieldName}>Task Completion Comment: </span>
                            <span
                                style={modalStyles.fieldValue}>{unassignModalData.userDetail.comments}</span>
                        </Col> : ''
                    }
                    {unassignModalData.submittedFiles.length !== 0 ? (
                        <Col span={24}>
                            {userFileList}
                        </Col>
                    ) : null}
                </Row>
            ) : ''}
        </ModalPopup>
    );
};
