import React, { useState, useEffect, useMemo } from 'react';
import { Button, Table, Tabs, Row, Typography } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Constants } from "../utils";
import { Link } from 'react-router-dom'

const { ProjectRecruitingStatus } = Constants;
const userProjectColumns = [
    {
        title: 'Project',
        dataIndex: 'reference_name',
        key: 'reference_name',
        render: (record, item) => (<Link to={`/app/research_study/${item.id}`}>{record}</Link>)
    },
    {
        title: 'Recruiting',
        dataIndex: 'recruiting_status',
        key: 'recruiting_status',
        render: (record) => {
            // build the icon based on the recruiting status
            const icon = (record === "OPEN")
                ? (<CheckCircleOutlined style={{ color: '#00FF00' }}/>)
                : (<ExclamationCircleOutlined style={{ color: '#FF0000' }}/>);

            // return a react fragment with the label and icon
            return (
                <>{ProjectRecruitingStatus[record].label} {icon}</>
            );
        }
    },
];

export default function UserProfileProjectList({ projectList = [] }) {
    // state variable and use effect hook to build the active and complete project list each time the data is changes
    const [displayedActiveProjectList, setDisplayedActiveProjectList] = useState([]);
    const [displayedCompletedProjectList, setDisplayedCompleteProjectList] = useState([]);
    useEffect(() => {
        // iterate over the project list and build a list for complete and active projects then set to state
        const activeProjectList = projectList.filter(({ is_complete: projectIsComplete }) => !projectIsComplete);
        const completedProjectList = projectList.filter(({ is_complete: projectIsComplete }) => projectIsComplete);

        setDisplayedActiveProjectList(activeProjectList);
        setDisplayedCompleteProjectList(completedProjectList);

    }, [setDisplayedActiveProjectList, projectList, setDisplayedCompleteProjectList]);
    // first check if we even have any projects, if we don't return null
    if (!projectList || projectList.length === 0) {
        return null;
    }

    // now build the array of items for the 2 tabs showing a table in each tab
    const commonTableAttributes = {
        columns: userProjectColumns,
        pagination: false
    };
    const tabTableItems = [
        {
            label: `Active Projects (${displayedActiveProjectList.length})`,
            key: "1",
            children: (<Table dataSource={displayedActiveProjectList} {...commonTableAttributes}/>)
        },
        {
            label: `Completed Projects ${displayedCompletedProjectList.length}`,
            key: "2",
            children: (<Table dataSource={displayedCompletedProjectList} {...commonTableAttributes}/>),
            disabled: displayedCompletedProjectList.length === 0
        }
    ];

    // render the tabs and return to display to the user
    return (
        <>
            <Row style={{ marginTop: '1em' }}>
                <Typography.Title level={4}>Project List</Typography.Title>
            </Row>
            <Row style={{ width: '100%' }}>
                <Tabs defaultActiveKey={"1"} items={tabTableItems}/>
            </Row>
        </>
    );
}
