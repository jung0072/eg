import { Menu } from "antd";
import { CheckOutlined, EditFilled, FileAddOutlined, MessageOutlined, UserAddOutlined } from "@ant-design/icons";
import React, { useCallback, useState } from "react";
import { EngageSpinner, getItemAntDMenu } from "../../utils";
import ResearchTaskFormModal from "./ResearchTaskFormModal";
import { useGetProjectActiveMembersQuery } from "../../../redux/services/researchProjectAPI";
import AssignTaskModal from "./AssignTaskModal";
import UploadFileModal from "./UploadFileModal";
import { useNavigate } from "react-router-dom";
import { useGetTaskQuery } from '../../../redux/services/researchTaskAPI';
import SubmitTaskModal from './SubmitTaskModal';
import FinalizeTaskModal from './FinalizeTaskModal';


export default function ResearchTaskToolMenu({ researchTaskData }) {
    // state variables for the research project tool menu
    const [assignTaskModal, setAssignTaskModal] = useState(false);
    const [editTask, setEditTask] = useState(false);
    const [uploadFileModal, setUploadFileModal] = useState(false);
    const navigate = useNavigate();
    const { research_project_id: researchProjectID, discussion_board: chatRoomCode, research_project_archive: isProjectArchived } = researchTaskData.task;
    const { user_permissions: currentUserPermissions, is_task_owner } = researchTaskData;
    const {
        data: activeProjectMembers,
        isLoading,
    } = useGetProjectActiveMembersQuery({ researchProjectID: researchProjectID, includeAll: true });
    const [alreadySubmittedTask, setAlreadySubmittedTask] = React.useState(false);
    const [submitTaskModal, setSubmitTaskModal] = React.useState(false);
    const [finalizeTaskModal, setFinalizeTaskModal] = React.useState(false);
    const {
        data,
        isSuccess,
    } = useGetTaskQuery(researchTaskData.task.task_id);

    React.useEffect(() => {
        if (isSuccess) {
            const { members } = data;
            members.forEach((member) => {
                if (member.id === currentUserPermissions?.user_id) {
                    if (member.is_complete) {
                        setAlreadySubmittedTask(true);
                        return;
                    }
                }
            });
        }
    }, [isSuccess]);
    // based on the current user permissions, set the menu options for assign task and edit task, then add in the
    // remaining options into the menu
    const menuItems = [];
    if (currentUserPermissions?.is_principal_investigator || is_task_owner || currentUserPermissions?.is_project_lead) {
        menuItems.push(getItemAntDMenu('Assign Task', '1', <UserAddOutlined />, null, null, isProjectArchived));
        menuItems.push({ type: "divider" });
        menuItems.push(getItemAntDMenu('Edit Task', '2', <EditFilled />, null, null, isProjectArchived));
        menuItems.push({ type: "divider" });
    }
    menuItems.push(getItemAntDMenu('Upload File', '3', <FileAddOutlined />, null, null, isProjectArchived));
    menuItems.push({ type: "divider" });
    menuItems.push(getItemAntDMenu('Discuss', '4', <MessageOutlined />));
    menuItems.push({ type: "divider" });
    menuItems.push(getItemAntDMenu('Mark Task Complete', '5', <CheckOutlined />, null, null, isProjectArchived));
    if (currentUserPermissions?.is_principal_investigator || is_task_owner || currentUserPermissions?.is_project_lead) {
        menuItems.push({ type: "divider" });
        menuItems.push(getItemAntDMenu('Finalize Task', '6', <CheckOutlined />, null, null, isProjectArchived));
    }

    // callback to handle which menu item was clicked
    const handleMenu = useCallback((item) => {
        switch (item.key) {
            case '1':
                setAssignTaskModal(true);
                break;
            case '2':
                setEditTask(true);
                break;
            case '3':
                setUploadFileModal(true);
                break;
            case '4':
                navigate(`/message_centre/?discussion=${chatRoomCode}`);
                break;
            case '5':
                setSubmitTaskModal(true)
            case '6':
                setFinalizeTaskModal(true)
            default:
                console.error("Unknown button pressed key is", item.key);
                break
        }
    }, [setAssignTaskModal, setEditTask, setUploadFileModal, navigate, chatRoomCode]);

    if (isLoading || !researchTaskData) {
        return (<EngageSpinner loaderText={""} />);
    }

    // TODO(Rahib): Confirm this if we want to show all user (active or not) when creating task
    // TODO(Rahib): if yes, should we also include the invited user via email (not on platform)
    // or wait for them to fill out their details and then include them, currently hiding them here.
    // filter out the deactivated anonymous user with no name
    const filteredActiveProjectMember = activeProjectMembers.filter((member) => member.label.trim() !== "")

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingLeft: '5px' }}>
                <Menu
                    style={{
                        display: 'block',
                        zIndex: 999,
                        borderRadius: '8px',
                        border: '1px solid #d9d9d9',
                        backgroundColor: '#F5F5F5',
                    }}
                    mode="inline"
                    theme="light"
                    items={menuItems}
                    onClick={handleMenu}
                />
                <AssignTaskModal isAssignTaskModalOpen={assignTaskModal} setAssignTaskModalOpen={setAssignTaskModal}
                    researchTaskData={researchTaskData} projectID={researchProjectID} teamMembers={filteredActiveProjectMember}
                />
                <ResearchTaskFormModal setModalVisible={setEditTask} modalVisible={editTask} isCreating={false}
                    project_id={researchProjectID} teamMembers={filteredActiveProjectMember}
                    researchTaskData={researchTaskData}
                />
                <UploadFileModal researchTaskData={researchTaskData} modalVisible={uploadFileModal}
                    setModalVisible={setUploadFileModal}
                />
                <SubmitTaskModal isTaskModalOpen={submitTaskModal} setTaskModalOpen={setSubmitTaskModal}
                    projectID={researchProjectID} researchTaskData={researchTaskData}
                    assignedUserTaskData={researchTaskData?.current_assigned_user_data}
                />
                <FinalizeTaskModal isTaskModalOpen={finalizeTaskModal} setTaskModalOpen={setFinalizeTaskModal}
                    projectID={researchProjectID} researchTaskData={researchTaskData}
                    assignedUserTaskData={researchTaskData?.current_assigned_user_data}
                />
            </div>
        </>
    );
}
