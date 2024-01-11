import React, { useCallback, useState } from 'react';
import { Button, Modal, Row } from "antd";
import {
    useRequestToJoinProjectMutation,
    useJoinProjectMutation
} from '../../../redux/services/researchProjectAPI';
import { openNotification, renderFormErrors } from "../../utils";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate } from 'react-router';

const { confirm } = Modal;

export function JoinProjectButton({ researchProjectData, userID, acceptInvite = false, isAnon }) {
    const [triggerJoinProjectQuery, { isLoading: isLoadingJoinProject }] = (acceptInvite)
        ? useJoinProjectMutation()
        : useRequestToJoinProjectMutation();
    const { id: projectID } = researchProjectData;
    const [clickedButton, setClickedButton] = useState(false);
    // state if the current user is anonymous or not
    const [showAnonJoinInfo, setShowAnonJoinInfo] = useState(acceptInvite === false && isAnon);
    const navigate = useNavigate();

    const showAnonInfoModal = () => {
        confirm({
            title: 'Would you like to share your data with the Project Team',
            icon: <ExclamationCircleOutlined />,
            content: (
                <>
                    <Row align={"middle"}>
                        <p>
                            Requesting to join this project means your profile information will be shared with the project lead(s).
                        </p>
                        <p>
                            If your request is approved, it will also be shared with the rest of the project team.
                        </p>
                        <p>
                            Do you wish to proceed?
                        </p>
                    </Row>
                </>
            ),
            onOk() {
                return new Promise((resolve) => {
                    setShowAnonJoinInfo(false); // Update showAnonJoinInfo to false here
                    resolve(); // Resolve the promise to close the modal
                }).then(() => {
                    handleJoinProjectButtonClick({ isHandlingAnonInfo: true }); // Call the function after resolving the modal promise
                });
            },
            onCancel() { },
            okText: "Yes",
            cancelText: "No",
            okButtonProps: {
                ...joinProjectButtonStyles.commonButtonProps,
                style: {
                    ...joinProjectButtonStyles.commonButtonProps.style,
                    backgroundColor: '#1AB759',
                }
            },
            cancelButtonProps: { ...joinProjectButtonStyles.commonButtonProps, danger: true, type: "primary", },
        });
    }

    const handleJoinProjectButtonClick = useCallback(({ isHandlingAnonInfo = false }) => {
        if (showAnonJoinInfo && !isHandlingAnonInfo) {
            showAnonInfoModal();
        } else {
            triggerJoinProjectQuery(projectID).then(({ data, error }) => {
                if (error) {
                    renderFormErrors(error, null, "Could not join Project");
                } else if (data) {
                    openNotification({
                        message: (acceptInvite) ? "Joined research project" : "Requested to Join Research Project",
                        description: `${data.success}`,
                        placement: 'topRight',
                        icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                    });
                    if (data?.is_active_on_project) {
                        navigate(0);
                    }
                    setClickedButton(true);
                }
            }).catch(console.error);
        }
    }, [showAnonJoinInfo]);

    return (
        <Button
            onClick={handleJoinProjectButtonClick}
            loading={isLoadingJoinProject}
            id="req-to-join-btn" type="default" shape="round" size="large"
            disabled={clickedButton}
        >
            {(clickedButton)
                ? 'Joined Project (pending approval)'
                : (acceptInvite) ? 'Join Project' : 'Request to Join Project'
            }
        </Button>
    );
}

const joinProjectButtonStyles = {
    commonButtonProps: {
        size: "medium",
        shape: "round",
        style: { minWidth: '100px', fontWeight: 'bold' },
    }
}
