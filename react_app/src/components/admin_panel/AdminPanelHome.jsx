import React from 'react';
import PendingProjects from './admin_panel_components/PendingProjects.jsx';
import PendingResearchers from './admin_panel_components/PendingResearchers.jsx';
import UserManagement from './admin_panel_components/UserManagement.jsx';
import CustomizeUserProfileForms from "./admin_panel_components/form_management/CustomizeUserProfileForms";
import ProjectManagement from './admin_panel_components/ProjectManagement.jsx';
import SystemMessage from './admin_panel_components/SystemMessage.jsx';
import SystemSettings from './admin_panel_components/SystemSettings.jsx';
import ResearchInterestFormManagement from './admin_panel_components/form_management/ResearchInterestFormManagement'

export default function AdminPanelHome({ activeCard }) {

    const renderCard = [
        { id: 1, component: <PendingProjects key={1} /> },
        { id: 2, component: <PendingResearchers key={2} /> },
        { id: 3, component: <ProjectManagement key={3} /> },
        { id: 4, component: <UserManagement key={4} /> },
        { id: 5, component: <SystemMessage key={5} /> },
        { id: 6, component: <CustomizeUserProfileForms key={6} /> },
        { id: 8, component: <ResearchInterestFormManagement key={8} /> },
        { id: 9, component: <SystemSettings key={9} /> },
    ];

    const idExists = renderCard.some((obj) => obj.id === parseInt(activeCard));
    if (!idExists) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Content Coming Soon
            </div>
        );
    }

    return (
        <div>
            {renderCard.map((cardComponent) => {
                if (parseInt(activeCard) === cardComponent.id) {
                    return cardComponent.component;
                }
            })}
        </div>
    );
}
