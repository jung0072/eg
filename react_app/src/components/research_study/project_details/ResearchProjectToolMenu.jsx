import React, { useCallback, useState } from "react";
import { Button, Menu, Row } from "antd";
import {
    SettingFilled,
    TeamOutlined,
    FileAddOutlined,
    EditFilled, MessageOutlined
} from "@ant-design/icons";
import UserPickerModal from "../../user_picker/UserPickerModal";
import ResearchTaskFormModal from "../research_task/ResearchTaskFormModal";
import { useGetProjectActiveMembersQuery } from "../../../redux/services/researchProjectAPI";
import { getItemAntDMenu } from "../../utils";
import { useNavigate } from "react-router-dom";



export default function ResearchProjectToolMenu({ researchProjectData }) {
    const { id: project_id, user_permissions: userPermissions, discussion_board: chatRoomCode, is_archived: isArchived } = researchProjectData;
    const navigate = useNavigate();
    const [isTaskModal, setIsTaskModal] = useState(false); // state for add task modal
    const [isTeamMemberModal, setIsTeamMemberModal] = useState(false); // state for add team member modal
    const {
        data: activeProjectMembers,
        isLoading,
    } = useGetProjectActiveMembersQuery({ researchProjectID: project_id, includeAll: false });

    const menuItems = [
        getItemAntDMenu('Add Team Member', '1', <TeamOutlined />, null, null, isArchived),
        { type: "divider" },
        getItemAntDMenu('Create Task', '2', <FileAddOutlined />, null, null, isArchived),
        { type: "divider" },
        getItemAntDMenu('Discuss', '3', <MessageOutlined />),
        { type: "divider" },
        getItemAntDMenu('Edit Project', '4', <EditFilled />),
    ];

    const handleMenu = useCallback((item) => {
        switch (item.key) {
            case '1':
                setIsTeamMemberModal(true);
                break;
            case '2':
                setIsTaskModal(true);
                break;
            case '3':
                navigate(`/message_centre/?discussion=${chatRoomCode}`);
                break;
            case '4':
                navigate(`/app/research_study_form/${researchProjectData.id}/`);
                break;
        }
    }, [setIsTeamMemberModal, setIsTaskModal, researchProjectData]);

    return (
        <div style={{ paddingLeft: "5px" }}>
            {!isLoading ?
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Menu
                        style={{
                            display: 'block',
                            zIndex: 999,
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            backgroundColor: '#F5F5F5',
                        }}
                        mode="inline"
                        // theme="light"
                        items={(userPermissions.is_principal_investigator) ? menuItems : menuItems.slice(0, 6)}
                        onClick={handleMenu}
                    />

                    <UserPickerModal setIsAddUserModalVisible={setIsTeamMemberModal}
                        IsAddUserModalVisible={isTeamMemberModal}
                        projectID={project_id}
                    />
                    {/* // TODO(Rahib): Confirm this => if we want to show all user (active or not) when creating task
                        // TODO(Rahib): if yes, should we also include the invited user via email (not on platform)
                        // or wait for them to fill out their details and then include them, currently hiding them here.
                    */}
                    <ResearchTaskFormModal project_id={project_id} setModalVisible={setIsTaskModal}
                        modalVisible={isTaskModal}
                        isCreating={true} teamMembers={activeProjectMembers.filter((member) => member?.label.trim() !== "")}
                    />
                </div>
                : ''
            }
        </div>
    );
}
