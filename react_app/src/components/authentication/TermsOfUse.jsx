import React from "react";
import { Modal } from "antd";
import TermsOfServicesContent from "../terms_of_services/TermsOfServicesContent";

export default function TermsOfUse({ setIsModalOpen, isModalOpen }) {
    const handleCancelModal = () => setIsModalOpen(false);
    return (
        <Modal centered={true} title={"Terms of Service"} open={isModalOpen} onCancel={handleCancelModal} footer={null}
               width={1000}
        >
            <TermsOfServicesContent />
        </Modal>
    );
}
