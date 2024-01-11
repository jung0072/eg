import { CheckCircleOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, DatePicker, Form, Input, Radio, Select, Space } from 'antd';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from "react-router-dom";
import { useCalendarReminderTypesQuery, useResearchProjectCalendarRemindersMutation } from '../../../../redux/services/researchProjectAPI';
import { Constants, openNotification, renderFormErrors } from '../../../utils';
import './createReminderDialog.css';

const { REMINDER_TYPES_ICONS } = Constants;
const { Item } = Form;
const { TextArea } = Input;

export default function ({
	setShowCreateReminder,
	researchTasks,
	reFetchReminders,
	updatingReminder = false,
	reminderData,
	onUpdateCancel,
	setShowUpdatedReminderInfos
}) {
	const [form] = Form.useForm();
	const [submitReminder, { isLoading: isLoadingReminderSubmission }] = useResearchProjectCalendarRemindersMutation();
	const { data: reminderTypes, isSuccess: isGetReminderTypesSuccessful } = useCalendarReminderTypesQuery();
	const [researchTask, setResearchTask] = useState();
	const { id: projectID } = useParams();

	const renderReminderTypes = useCallback(() =>
		isGetReminderTypesSuccessful &&
		Object.values(reminderTypes).map((reminderType) => {
			const { label, icon } = REMINDER_TYPES_ICONS[reminderType.type];
			return <Radio.Button
				className="reminder-type"
				key={reminderType.type}
				value={reminderType.type}
				style={{ backgroundColor: reminderType.tag_colour }}
			>
				<FontAwesomeIcon icon={icon} />
				&ensp;{label}
			</Radio.Button>
		}), [reminderTypes, isGetReminderTypesSuccessful, REMINDER_TYPES_ICONS, updatingReminder]);

	const handleCancelBtnClick = useCallback(() => setShowCreateReminder(false), []);
	const handleFormFinish = useCallback(
		(values) => {
			submitReminder({
				values,
				projectID,
				updatingReminder,
				reminder_id: reminderData?.id
			}).then(({ data, error }) => {
				if (error) {
					renderFormErrors(error);
					return;
				}
				reFetchReminders();
				openNotification({
					message: "Successfully created calendar reminder",
					placement: 'topRight',
					icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
				})
				if (!isLoadingReminderSubmission && updatingReminder) {
					// push the reminder id that was updated and close the modal
					setShowUpdatedReminderInfos((prev) => [...prev, reminderData.id]);
					onUpdateCancel();
				}
				setShowCreateReminder(false);
			}).catch(console.error)
		},
		[submitReminder, projectID, reFetchReminders]
	);

	const tasksOptions = useMemo(() => researchTasks.map(task => ({
		value: task.task_id,
		label: task.title,
		key: `task=${task.task_id}`
	})), [researchTasks]);

	const handleResearchTaskChange = useCallback((taskId) => {
		if (updatingReminder) {
			return
		} else {
			const selectedTask = researchTasks.find(task => task.task_id === taskId);
			setResearchTask(selectedTask);
		}
	}, [researchTasks]);

	useEffect(() => {
		// if we are updating reminder set the form field from reminderData
		if (updatingReminder) {
			form.setFieldsValue({
				...reminderData,
				due_date: moment(reminderData.due_date),
				research_task: reminderData?.research_task?.task_id,
				reminder_type: reminderData.calendar_reminder.type
			})
		}
		// check if research task exist and set the title and other fields
		if (!updatingReminder && researchTask) {
			const { title, description, due_date } = researchTask;
			form.setFieldsValue({
				'title': title,
				'description': description,
				'due_date': moment(due_date) ?? null,
			});
		}
	}, [researchTask, updatingReminder, form]);

	return (
		<div className="create-reminder-wrapper">
			<Form form={form} className="w-50" onFinish={handleFormFinish}>
				<h2 className="create-reminder-title">{updatingReminder ? "Update Reminder" : "Create a New Reminder"}</h2>
				<Item
					className="mb-15"
					label="Research Task (optional)"
					name="research_task"
					labelCol={{ span: 24 }}
					colon={false}
				>
					<Select
						allowClear
						showSearch
						optionFilterProp="label"
						placeholder="Select research task"
						options={tasksOptions}
						onChange={handleResearchTaskChange}
					/>
				</Item>
				<Item
					className="mb-15"
					label="Title"
					name="title"
					labelCol={{ span: 24 }}
					colon={false}
					rules={[{ required: true, message: "You must enter a title" }]}
				>
					<Input />
				</Item>
				<Item
					className="mb-15"
					label="Description"
					name="description"
					labelCol={{ span: 24 }}
					colon={false}
				>
					<TextArea />
				</Item>
				<Item
					label="Due date"
					name="due_date"
					labelCol={{ span: 24 }}
					colon={false}
					rules={[{ required: true, message: "You must enter a due date" }]}
				>
					<DatePicker />
				</Item>
				<Item
					label="Reminder Type"
					name="reminder_type"
					labelCol={{ span: 24 }}
					colon={false}
					rules={[
						{ required: true, message: "You must select a reminder type" },
					]}
				>
					<Radio.Group name="reminder_type">
						<Space>{renderReminderTypes()}</Space>
					</Radio.Group>
				</Item>
				<br />
				<Item>
					<Space>
						<Button
							size="large"
							className="cancel-btn"
							onClick={updatingReminder ? onUpdateCancel : handleCancelBtnClick}
						>
							Cancel
						</Button>
						<Button
							size="large"
							className="create-reminder-btn"
							type="primary"
							htmlType="submit"
							loading={isLoadingReminderSubmission}
						>
							{updatingReminder ? 'Save' : 'Create Reminder'}
						</Button>
					</Space>
				</Item>
			</Form>
		</div>
	);
}
