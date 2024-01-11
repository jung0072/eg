import ModalPopup from "../../utils/ModalPopup";
import React, {useCallback} from "react";
import {openNotification} from "../../utils";
import { usePromptAllUsersMutation, usePromptUserMutation } from "../../../redux/services/researchTaskAPI";

export const PromptIncompleteTaskUserModal = (
    {
        isModalVisible,
        promptAllUsers,
        data,
        setModalVisible,
        setSelectedPromptUserData,
        setPromptAllUsers
    }
) => {
    const [promptUser, { isLoading: isLoadinUserPrompt }] = usePromptUserMutation();
    const [promptAllUsersMutation, { isLoading: isLoadingPromptAllUsers }] = usePromptAllUsersMutation();
    function handlePromptUser() {
        if (promptAllUsers) {
            //Prompt all the users
            promptAllUsersMutation(data).then((res) => {
                const { error, data: resData } = res;
                const notificationType = error ? 'error' : 'success';
                const description = error ? error?.data?.error ?? error?.data?.detail : resData?.success;

                openNotification({
                    placement: 'topRight',
                    type: notificationType,
                    description: description
                })
                setPromptAllUsers(false);
            });

        } else {
            promptUser(data).then((res) => {
                const { error, data: resData } = res;
                const notificationType = error ? 'error' : 'success';
                const description = error ? error?.data?.error ?? error?.data?.detail : resData?.success;

                openNotification({
                    placement: 'topRight',
                    type: notificationType,
                    description: description
                });
            });
            //prompt the user object received
        }
        setModalVisible(false)
        setSelectedPromptUserData({
            taskId: null,
            projectId: null,
            userId: null,
            userName: null,
        });
    }

    return <ModalPopup
            title= { promptAllUsers?
                "Prompt All Users"
                : `Prompt ${data.userName}`

            }
            visible={isModalVisible}
            handleCancel={() => {
                setModalVisible(false);
                setPromptAllUsers(false);
            }}
            handleOk={handlePromptUser}
            type="info"
            disableScreenTouch={true}
            footerButton={promptAllUsers
                ? "Prompt Everyone"
                : "Prompt"
            }
            centered={true}
            width={750}
    >
        <h2>You are about to prompt users to complete the pending task.</h2>
    </ModalPopup>
}
