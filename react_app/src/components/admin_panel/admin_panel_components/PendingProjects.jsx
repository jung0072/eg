import React, { memo, useCallback } from "react";
import { usePendingResearchProjectsQuery, useApproveResearchProjectMutation } from "../../../redux/services/adminAPI";
import { Link } from "react-router-dom";
import { PROJECT_DETAILS_ROUTE, USER_PROFILE_ROUTE } from "../../utils/constants";
import { Button, Space, Spin, Table, Typography } from "antd";
import { CheckCircleFilled, CheckCircleOutlined } from "@ant-design/icons";
import { EngageSpinner, openNotification, renderFormErrors } from "../../utils";


function PendingProjects() {
    const {
        data: pendingResearchProjects,
        isLoading: isLoadingResearchProjects,
        refetch: reFetchProjects
    } = usePendingResearchProjectsQuery();
    const [approveResearchProject, { isLoading: isLoadingApproveResearchProject }] = useApproveResearchProjectMutation();
    const handleApproveProject = useCallback((projectID) => {
        approveResearchProject(projectID).then(({ data, error }) => {
            if (error) {
                renderFormErrors(error, null, "Error submitting research project for approval!");
            } else {
                // show the user a notification on save and then navigate them to the next page after a few seconds
                openNotification({
                    message: "Approved research project",
                    description: `You have approved the project ${data.title}`,
                    placement: 'topRight',
                    callback: () => reFetchProjects(),
                    timeout: 200,
                    icon: (<CheckCircleOutlined style={{ color: 'green' }}/>),
                });
            }
        }).catch(console.error);
    }, [approveResearchProject, reFetchProjects]);

    const pendingResearchProjectColumns = [
        {
            title: 'Project ID',
            dataIndex: 'pid',
            key: 'pid',
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (_, record) => (
                <Link to={`${PROJECT_DETAILS_ROUTE}${record.pid}/`}>
                    {record.title}
                </Link>
            ),
        },
        {
            title: 'Submission Date',
            dataIndex: 'submittedOn',
            key: 'submittedOn',
        },
        {
            title: 'Update At',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button onClick={() => handleApproveProject(record.pid)} icon={<CheckCircleFilled/>}/>
                </Space>
            ),
        },
    ];

    if (isLoadingResearchProjects) {
        return <EngageSpinner loaderText={"Loading Research Projects"}/>;
    }

    return (
        <div key={"pending_research_project"}>
            <Typography.Title level={3}>Pending Research Projects</Typography.Title>
            <Table pagination={false} dataSource={pendingResearchProjects} columns={pendingResearchProjectColumns}/>
        </div>
    );

}

export default memo(PendingProjects);
