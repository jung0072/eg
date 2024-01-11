import React, { memo, useCallback } from "react";
import { Button, Space, Spin, Table, Typography } from "antd";
import { Link } from "react-router-dom";

import { USER_PROFILE_ROUTE } from "../../utils/constants.jsx";

import {useApproveResearchersMutation, useGetPendingResearchersQuery } from "../../../redux/services/adminAPI.js";
import { openNotification } from "../../utils/";
import { CheckCircleOutlined } from "@ant-design/icons";

const { Title } = Typography;

function PendingResearchers() {

    const {
        data: pendingResearchers,
        isLoading: loadingResearchers,
		refetch
    } = useGetPendingResearchersQuery()

	const [approveResearchers] = useApproveResearchersMutation()

    const handleApprove = useCallback(async (id) => {
		await approveResearchers(id).unwrap()
		.then((res) => {
			if(res) {
				refetch()
                openNotification({
                    placement: 'top',
                    message: 'Approve Researcher',
                    description: `${res.success}: ${res.user}`,
                    icon: <CheckCircleOutlined style={{ color: 'green' }}/>
                });
			}
		}).catch((err) => {
			openNotification({
				placement: 'top',
				message: 'Failed to Approve Researcher',
				description: `${err}`,
				icon: <CheckCircleOutlined style={{color: 'red'}} />
			})
		})
	})

	if(loadingResearchers) {
		return <Spin />
	}

	const pendingResearcherColumns = [
		{
			title: 'User ID',
			dataIndex: 'uid',
			key: 'uid',
		},
		{
			title: 'Name',
			dataIndex: 'name',
			key: 'name',
			render: (_, record) => (
				<Link to={`${USER_PROFILE_ROUTE}${record.uid}/`}>
					{record.name}
				</Link>
			),
		},
		{
			title: 'Submission Date',
			dataIndex: 'submitted_on',
			key: 'submitted_on',
		},
		{
			title: 'Research Interests',
			dataIndex: 'research_interests',
			key: 'research_interests',
			width: '35%'
		},
		{
			title: 'Action',
			key: 'action',
			render: (_, record) => (
				<Space size='middle'>
					<Button onClick={() => handleApprove(record.uid)}>
						Approve
					</Button>
				</Space>
			),
		},
	];

	return (
            <div key={"pending_researchers"}>
                <Title level={3}>Pending Researchers</Title>
                <Table pagination={false} dataSource={pendingResearchers} columns={pendingResearcherColumns} />
            </div>
    )
}

export default memo(PendingResearchers);
