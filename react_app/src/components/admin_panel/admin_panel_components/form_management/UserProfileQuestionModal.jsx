import React from 'react';
import ModalPopup from "../../../utils/ModalPopup";
import UserProfileQuestionForm from "./UserProfileQuestionForm";

export default function UserProfileQuestionModal(
    {
        isVisible,
        setIsVisible,
        selectedQuestionID,
        researchInterestsOptions,
        allQuestionData,
        sectionData
    }
) {
    const handleCloseModal = () => setIsVisible(false)
    return (
        <ModalPopup
            title="Edit User Profile Question"
            visible={isVisible}
            // TODO: add a submit and cancel event
            handleOk={null}
            handleCancel={handleCloseModal}
            type="info"
            footerButton="Update"
            width={800}
        >
            <UserProfileQuestionForm
                selectedQuestionID={selectedQuestionID}
                researchInterestsOptions={researchInterestsOptions}
                allQuestionData={allQuestionData}
                sectionData={sectionData}
                handleCloseModal={handleCloseModal}
            />
        </ModalPopup>
    );
}
