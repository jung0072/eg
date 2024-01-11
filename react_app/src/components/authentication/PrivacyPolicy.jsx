import React from "react";
import { Modal } from "antd";
import PrivacyPolicyContent from "../privacy_policy/PrivacyPolicyContent";

export default function PrivacyPolicy({ isModalOpen, setIsModalOpen }) {
    const handleCancelModal = () => setIsModalOpen(false);
    return (
        <Modal centered={true} title={"Task Submission"} open={isModalOpen} onCancel={handleCancelModal} footer={null}
               width={1000}
        >
            <PrivacyPolicyContent />
        </Modal>
    );

}