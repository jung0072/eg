import React, { memo, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PROJECT_DETAILS_ROUTE } from "../../utils/constants";
import { Button, Col, Input, Row, Select, Space, Table, Typography } from "antd";
import { EngageSpinner, openNotification, renderFormErrors } from "../../utils";
import { DownloadOutlined } from "@ant-design/icons";
import {
	useGetAllResearchProjectDataQuery, useLazyGetChatLogsForProjectQuery,
	useDeleteProjectMutation
} from "../../../redux/services/adminAPI";
import ModalPopup from "../../utils/ModalPopup.jsx";
import { CheckCircleOutlined } from "@ant-design/icons";

const { Title } = Typography;

function ProjectManagement({ refreshPageAndSetActiveCard, key }) {

	const [reqDelete, setReqDelete] = useState({ visible: false, record: null });
	// A Redux hook for deleting a user
	const [deleteProject] = useDeleteProjectMutation();
	const handleDeleteProject = (record) => {
		setReqDelete({ ...reqDelete, visible: true, record: record });
	}
	const handleDeleteProjectCallback = useCallback((projectId) => {
		deleteProject(projectId).then((apiResponse) => {
			const { success, error } = apiResponse.data;
			if (error) {
				renderFormErrors({ data: { error } });
			} else if (success) {
				// show the admin a notification saying the user was deleted and then close the modal
				openNotification({
					placement: 'topRight',
					message: `Successfully Deleted Project ${projectId}`,
					description: `${success}`,
					icon: <CheckCircleOutlined style={{ color: 'green' }} />
				});
				setReqDelete({ ...reqDelete, visible: false, record: null });
				// Store the activeCard value in sessionStorage
				sessionStorage.setItem('activeCard', key);
				// Reload the page
				window.location.reload();
			}
		});
	}, [setReqDelete]);

	const {
		data: allProjects,
		isLoading: loadingProjects,
		refetch: refetchForAllProjects,
	} = useGetAllResearchProjectDataQuery();

	const [
		executeGetChatLogsForProject,
		{ data: chatLogsForProject, refetch: refetchChatLogsForProject }
	] = useLazyGetChatLogsForProjectQuery();

	const handleDownLoadChatLogs = useCallback(async (id, projectTitle) => {
		await executeGetChatLogsForProject(id).then((apiResponse) => {
			const { isSuccess, isError } = apiResponse;
			if (isError) {
				renderFormErrors({ data: { isError } });
			} else if (isSuccess) {
				openNotification({
					placement: 'topRight',
					message: `The chat logs for project <${projectTitle}> have been sent to your email`,
					icon: <CheckCircleOutlined style={{ color: 'green' }} />
				});
			}
		});
	}, [executeGetChatLogsForProject]);

	if (loadingProjects) {
		return <EngageSpinner loaderText={"Loading Projects"} />;
	}

	const allProjectsColumns = [
		{
			title: "Title",
			dataIndex: "reference_name",
			key: "project_name",
			render: (_, record) => (
				<Link to={`${PROJECT_DETAILS_ROUTE}${record.id}/`}>
					{record.reference_name}
				</Link>
			),
		},
		{
			title: "Creator",
			dataIndex: "creator_full_name",
			key: "creator",
			render: (_, record) => (
				<a href={`mailto:${record.contact_email}`}>
					{record.creator_full_name}
				</a>
			),
		},
		{
			title: "Submitted On",
			dataIndex: "submittedOn",
			key: "submittedOn",
		},
		{
			title: "Updated At",
			dataIndex: "updatedAt",
			key: "updatedAt",
		},
		{
			title: "Team Size",
			dataIndex: "team_size",
			key: "team_size",
		},
		{
			title: "Tasks",
			dataIndex: "number_of_tasks",
			key: "number_of_tasks",
		},
		{
			title: "Chat Logs",
			key: "download_chat_logs",
			render: (_, record) => (
				<Space size="middle" >
					<Button onClick={() => {
						handleDownLoadChatLogs(record.id, record.reference_name)
					}} icon={<DownloadOutlined />} />
				</Space>
			),
		},
		{
			title: "Action",
			key: "action",
			render: (_, record) => (
				<Space size="middle" >
					<Button onClick={() => handleDeleteProject(record)}>
						Delete
					</Button>
				</Space>
			),
		},
	];

	return (
		<div key={"project_management"}>
			<Title level={3}>Project Management</Title>
			<Table
				pagination={false}
				dataSource={allProjects}
				columns={allProjectsColumns}
			/>

			{/* The delete project modal */}
			{reqDelete.visible ? (
				<ModalPopup
					title="Delete Project"
					visible={reqDelete.visible}
					handleOk={() => handleDeleteProjectCallback(reqDelete.record.id)

					}
					handleCancel={() => setReqDelete({ ...reqDelete, visible: false, record: null })}
					type="info"
					disableScreenTouch={true}
					footerButton="Delete Project"
					centered={true}
					width={650}
				>
					<Row align={'center'}>
						<h1 style={projectManagementStyles.warningTitle}>Warning!</h1>
						<h2 style={projectManagementStyles.userDeleteTitle}>
							Deleting a project means, all their data will be deleted including tasks and their messages. Please confirm the project detail first.
						</h2>
					</Row>
					<Row>
						<Col span={12}><span style={projectManagementStyles.fieldName}>Project Title: </span> <span
							style={projectManagementStyles.fieldValue}>{reqDelete.record.reference_name}</span>
						</Col>
						<Col span={12}><span style={projectManagementStyles.fieldName}>Creator: </span> <span
							style={projectManagementStyles.fieldValue}>{reqDelete.record.creator_full_name}</span>
						</Col>
						<Col span={24}><span style={projectManagementStyles.fieldName}>Number of Tasks: </span> <span
							style={projectManagementStyles.fieldValue}>{reqDelete.record.number_of_tasks}</span>
						</Col>
					</Row>
				</ModalPopup>
			) : null
			}
		</div >
	);
}

export default memo(ProjectManagement);


const projectManagementStyles = {
	warningTitle: {
		color: 'red',
		textAlign: 'center',
		fontWeight: 'bolder',
	},
	userDeleteTitle: {
		fontSize: '1.2em',
		color: 'var(--primary-color-1)',
	},
	fieldName: {
		fontSize: '1.2em',
		fontWeight: 'bold',
	},
	fieldValue: {
		fontSize: '1.2em'
	}
};
