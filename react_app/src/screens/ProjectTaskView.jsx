import React, { useContext, useEffect } from 'react';
import { DANGER, GREYED, PRIMARY_1, SUCCESS, WARNING } from '../components/utils/colors.jsx';
import { Col, Row } from 'antd';
import ResearchTaskToolMenu from "../components/research_study/research_task/ResearchTaskToolMenu";
import ResearchProjectBreadcrumbs from "../components/research_study/projects/ResearchProjectBreadcrumbs";
import { useEngageStylingLayout } from '../providers/EngageLayoutStylingContextProvider.jsx';
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { MENU_ROUTES } from "../components/utils/constants";

const taskStatus = [
    { name: "Task Due Soon", color: WARNING },
    { name: "Task Overdue", color: DANGER },
    { name: "Assign Task", color: SUCCESS },
    { name: "Task Close", color: GREYED },
    { name: "Unassigned", color: GREYED },
];

export default function ProjectTaskView({ view, children, status, researchTaskData }) {


    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);

    // useEffect hook for the component did mount lifecycle event
    useEffect(() => {
        // remove the padding
        removeLayoutPadding(false);
        // remove the white background color
        changeBackgroundColor(false);
        // set the active nav menu to the research projects page
        updateActiveNavigationMenu(MENU_ROUTES[3].key)
    }, []);

    let matchingStatus = "";
    let statusColor = "";

    if (status !== null) {
        matchingStatus = taskStatus.find((s) => s.name === status);
        statusColor = matchingStatus ? matchingStatus.color : GREYED;
    }

    return (
        <>
            <ResearchProjectBreadcrumbs researchTaskData={researchTaskData.task} type={"TASK"} />
            <div style={{
                ...projectMemberViewStyles.content_box, border: 'none', width: '100%', margin: 0, padding: 0
            }}
            >
                <div style={projectMemberViewStyles.project_header}>
                    <Row
                        style={projectMemberViewStyles.project_header_column_2}
                    >
                        <Col
                            style={projectMemberViewStyles.header_text_1}
                        >
                            <span>Status: </span>
                            <span style={{ color: statusColor }}>
                                {status !== null ? status : ''}
                            </span>
                        </Col>
                    </Row>
                </div>
                <div>
                    <Row>
                        <Col span={19}>
                            {children}
                        </Col>
                        <div style={{ width: "19%", marginTop: "10px" }}>
                            <ResearchTaskToolMenu researchTaskData={researchTaskData} />
                        </div>
                    </Row>
                </div>
                <div style={{ height: '10px' }} />
            </div>
        </>
    );
}

const projectMemberViewStyles = {
    content_box: {
        display: 'flex',
        flexDirection: 'column',
        width: '90%',
        height: 'auto',
        minHeight: '90%',
        border: '1px solid #D9D9D9',
        borderRadius: '8px',
        margin: '1% 5%',
        position: 'relative',
        padding: '10px',
    },
    project_header: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        alignItems: 'center',
    },
    project_header_column_2: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    back_button: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    header_text_1: {
        fontWeight: '400',
        fontSize: '16px',
        lineHeight: '42px',
        letterSpacing: '0.1px',
        color: '#52575C',
    },
    share_link_button: {
        height: '3em',
        width: '14em',
        backgroundColor: PRIMARY_1,
        borderRadius: '15px',
        fontWeight: 700,
        fontSize: '1em',
        lineHeight: '2em',
        textAlign: 'center',
        color: 'white',
        justifySelf: 'start'
    },
    breadcrumb_style: {
        fontWeight: '600',
        fontSize: '14px',
        lineHeight: '16px',
        letterSpacing: '0.2px',
        color: '#949494',
    },
    project_title: {
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: '24px',
        lineHeight: '42px',
        letterSpacing: '0.1px',
        color: '#52575C',
    }
};
