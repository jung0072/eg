import { faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Badge, Button, Calendar, Col, Modal, Row, Tooltip, Typography } from 'antd';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import { useDeleteResearchProjectCalendarRemindersMutation, useGetResearchProjectCalendarRemindersQuery } from '../../../redux/services/researchProjectAPI';
import { Constants, openNotification } from '../../utils/';
import './projectCalendar.css';

import CreateReminderDialog from './create_reminder_dialog/CreateReminderDialog.jsx';
import ReminderCard from './reminder_card/ReminderCard.jsx';
import { Link } from 'react-router-dom';
import ModalPopup from '../../utils/ModalPopup';
import { CheckCircleOutlined } from '@ant-design/icons';
import { projectArchiveDisableActionString } from '../../utils/constants.strings.js';

const { CALENDAR_MODES, REMINDER_TYPES_ICONS } = Constants;
const DATE_FORMAT = 'YYYY-MM-DD';
const { Text, Paragraph, Title } = Typography;

const groupRemindersPayloadByDueDate = (reminders) => {
    return reminders.reduce((accumulator, currentReminder) => {
        const dueDate = moment(currentReminder.due_date).format(DATE_FORMAT);

        accumulator[dueDate] = accumulator[dueDate]
            ? [...accumulator[dueDate], currentReminder]
            : [currentReminder];

        return accumulator;
    }, {});
};

const buildCellRemindersList = (reminders) => (
    <ul className="reminders-list">
        {reminders.map((reminder, index) => {
            const { calendar_reminder, title } = reminder;
            return (
                <li key={index}>
                    <Badge
                        color={calendar_reminder.tag_colour}
                        text={<span style={{ color: calendar_reminder.tag_colour }}>{title}</span>}
                    />
                </li>
            );
        })}
    </ul>
);

export default function ({ researchProjectData }) {
    const { id, tasks, user_permissions } = researchProjectData;
    const {
        data: researchProjectReminderData,
        isSuccess: isGetRemindersSuccessful,
        refetch: reFetchReminders,
    } = useGetResearchProjectCalendarRemindersQuery(id);
    const [deleteCalendarReminder] = useDeleteResearchProjectCalendarRemindersMutation();
    const [groupedReminders, setGroupedReminders] = useState([]);
    const [currentReminders, setCurrentReminders] = useState([]);
    const [panelDate, setPanelDate] = useState(moment());
    const [mode, setMode] = useState(CALENDAR_MODES.MONTH);
    const [showCreateReminder, setShowCreateReminder] = useState(false);
    const isProjectController = user_permissions.is_principal_investigator || user_permissions.is_project_lead

    // states for reminder cards
    const [isReminderModalVisible, setIsReminderModalVisible] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
    const [isDeletingReminder, setIsDeletingReminder] = useState(false);
    const [showUpdatedRemindersInfo, setShowUpdatedReminderInfos] = useState([])

    // handle modal delete
    const modalDeleteCalendarReminder = useCallback((reminderId) => {
        deleteCalendarReminder({ reminderId, id })
            .then((res) => {
                if (res.data?.success) {
                    openNotification({
                        message: res.data.success,
                        placement: 'topRight',
                        icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                    });
                    setIsDeletingReminder(false);
                    setIsReminderModalVisible(false);
                    reFetchReminders();
                } else {
                    openNotification({
                        message: res.error.data.error ?? res.error.data?.detail,
                        placement: 'topRight',
                        icon: (<CheckCircleOutlined style={{ color: 'red' }} />),
                    });
                }
            }).catch((error) => {
                console.log(error);
            })
    }, [])

    const onPanelChange = useCallback(
        (date, mode) => {
            setPanelDate(date);
            setMode(mode);
        },
        [setPanelDate, setMode]
    );

    const getRemindersForDate = useCallback(
        (date) => {
            const formattedDate = date.format(DATE_FORMAT);
            return groupedReminders[formattedDate] || [];
        },
        [groupedReminders]
    );

    const getRemindersForMonth = useCallback(
        (date) => {
            return Object.keys(groupedReminders).reduce((accumulator, current) => {
                const currentDate = moment(current);
                if (currentDate.month() === date.month() && currentDate.year() === date.year()) {
                    accumulator.push(...groupedReminders[current]);
                }
                return accumulator;
            }, []);
        },
        [groupedReminders]
    );

    const getRemindersForYear = useCallback(
        (date) => {
            return Object.keys(groupedReminders).reduce((accumulator, current) => {
                const currentDate = moment(current);
                if (currentDate.year() === date.year()) {
                    accumulator.push(...groupedReminders[current]);
                }
                return accumulator;
            }, []);
        },
        [groupedReminders]
    );

    const dateCellRenderer = useCallback((date) => {
        const reminders = getRemindersForDate(date);
        return buildCellRemindersList(reminders);
    }, [getRemindersForDate, buildCellRemindersList]);

    const monthCellRenderer = useCallback((date) => {
        const reminders = getRemindersForMonth(date);
        return buildCellRemindersList(reminders);
    }, [buildCellRemindersList, getRemindersForMonth]);

    const handleReminderCardClick = (reminder, isUpdatedRecently) => {
        // on card click check if it has the id for updated recently
        // if it does pop that value from the array
        if (isUpdatedRecently) {
            setShowUpdatedReminderInfos(prev => prev.filter(item => item !== isUpdatedRecently));
        }
        setSelectedReminder(reminder);
        setIsReminderModalVisible(true);
    };
    const buildCurrentRemindersList = useCallback(() => {
        const { label: selectedLabel, icon: selectedIcon } = selectedReminder
            ? REMINDER_TYPES_ICONS[selectedReminder.calendar_reminder.type]
            : { label: '', icon: '' };

        if (currentReminders.length === 0) {
            return <Typography.Text>No reminders</Typography.Text>;
        }
        return (
            <div id="reminders-list-wrapper">
                {currentReminders.map((reminder, index) => {
                    const { calendar_reminder, title, due_date } = reminder;
                    const { type, tag_colour } = calendar_reminder;
                    const { icon } = REMINDER_TYPES_ICONS[type];
                    const formattedDueDate = moment(due_date).format(DATE_FORMAT);
                    // unique id array for the update info icon
                    const uniqueUpdatedReminderId = Array.from(new Set(showUpdatedRemindersInfo));
                    const isUpdatedRecently = uniqueUpdatedReminderId.find(item => item === reminder.id);

                    return (
                        <ReminderCard
                            key={index}
                            colorHex={tag_colour}
                            title={title}
                            dueDate={formattedDueDate}
                            icon={icon}
                            openInfo={isUpdatedRecently ? true : false}
                            onClick={() => handleReminderCardClick(reminder, isUpdatedRecently)} // Pass the reminder to the click handler
                        />
                    )
                })}
                {/* Modal for displaying reminder details */}
                <Modal
                    title={selectedReminder ? selectedReminder.title : 'Reminder Details'}
                    open={isReminderModalVisible}
                    width={isUpdatingReminder ? 750 : 600}
                    onCancel={() => {
                        setIsReminderModalVisible(false)
                        setIsUpdatingReminder(false)
                    }}
                    footer={!isUpdatingReminder && isProjectController ? (
                        <Row align={'middle'} justify={'space-between'}>
                            <Col>
                                <Tooltip title={researchProjectData.is_archived && projectArchiveDisableActionString}>
                                    <span>
                                        <Button
                                            disabled={researchProjectData.is_archived}
                                            style={projectCalenderStyles.button}
                                            onClick={() => { isUpdatingReminder ? setIsUpdatingReminder(false) : setIsDeletingReminder(true) }}
                                        >
                                            Delete Reminder
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Col>
                            <Col>
                                <Tooltip title={researchProjectData.is_archived && projectArchiveDisableActionString}>
                                    <span>
                                        <Button
                                            disabled={researchProjectData.is_archived}
                                            style={projectCalenderStyles.button}
                                            onClick={() => setIsUpdatingReminder(true)}
                                        >
                                            Update Reminder
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Col>
                        </Row>
                    ) : false}
                >
                    {/* Display reminder details here */}
                    {selectedReminder && (
                        isUpdatingReminder ? (
                            <CreateReminderDialog
                                setShowCreateReminder={() => setShowCreateReminder(false)}
                                updatingReminder reminderData={selectedReminder}
                                researchTasks={tasks} reFetchReminders={reFetchReminders}
                                onUpdateCancel={() => {
                                    setIsUpdatingReminder(false)
                                    setIsReminderModalVisible(false)
                                }}
                                setShowUpdatedReminderInfos={setShowUpdatedReminderInfos}
                            />
                        ) : (
                            <Row className="reminder-details">
                                <Col span={24}>
                                    {selectedReminder?.research_task?.task_id ? (
                                        <Title level={4}>
                                            This reminder is associated with a
                                            <Link to={`/app/research_task/${selectedReminder.research_task?.task_id}`}> task</Link>
                                        </Title>
                                    ) : null}
                                </Col>
                                <Col span={24}>
                                    <Title level={4}>Due Date:</Title>
                                    <Paragraph style={projectCalenderStyles.reminderDetailsText}>
                                        {new Date(selectedReminder.due_date).toLocaleDateString()}
                                    </Paragraph>
                                </Col>
                                <Col span={24}>
                                    <Title level={4}>Description:</Title>
                                    <Paragraph style={projectCalenderStyles.reminderDetailsText}>
                                        {selectedReminder.description}
                                    </Paragraph>
                                </Col>
                                <Col span={24}>
                                    <Title level={4}>Reminder Type:</Title>
                                    <div className='in-details-reminder-type' style={{ backgroundColor: selectedReminder.calendar_reminder.tag_colour }}>
                                        <FontAwesomeIcon icon={selectedIcon} />
                                        {selectedLabel}
                                    </div>
                                </Col>
                            </Row>
                        )
                    )}
                </Modal>
                {/* Modal for deleting reminder */}
                {isDeletingReminder ? (
                    <ModalPopup
                        title="Delete Reminder"
                        visible={isDeletingReminder}
                        handleOk={() => modalDeleteCalendarReminder(selectedReminder.id)}
                        handleCancel={() => setIsDeletingReminder(false)}
                        type="info"
                        disableScreenTouch={true}
                        footerButton="Delete Reminder"
                        centered={true}
                        width={650}
                    >
                        <Row align={'center'}>
                            <h1 style={projectCalenderStyles.warningTitle}>Warning!</h1>
                            <h2 style={projectCalenderStyles.userDeleteTitle}>
                                Deleting a reminder means permanently removing it from the project calendar.
                                Confirm the details before deleting it.
                            </h2>
                        </Row>
                        <Row gutter={20}>
                            <Col span={24}>
                                <span style={projectCalenderStyles.fieldName}>Reminder Title: </span>
                                <span style={projectCalenderStyles.fieldValue}>
                                    {selectedReminder.title}
                                </span>
                            </Col>
                            <Col span={24}>
                                <span style={projectCalenderStyles.fieldName}>Creator: </span>
                                <span style={projectCalenderStyles.fieldValue}>
                                    {`${selectedReminder.creator.first_name} ${selectedReminder.creator.last_name}`}
                                </span>
                            </Col>
                            <Col span={24}>
                                <span style={projectCalenderStyles.fieldName}>Due Date: </span>
                                <span style={projectCalenderStyles.fieldValue}>
                                    {new Date(selectedReminder.due_date).toLocaleDateString()}
                                </span>
                            </Col>
                            <Col span={24}>
                                <span style={projectCalenderStyles.fieldName}>Linked to Task: </span>
                                <span style={projectCalenderStyles.fieldValue}>
                                    {selectedReminder.research_task?.task_id ? (
                                        <Link to={`/app/research_task/${selectedReminder.research_task?.task_id}`}>
                                            {selectedReminder.research_task.title}
                                        </Link>
                                    ) : "Not linked to any task"}
                                </span>
                            </Col>
                            <Col span={24}>
                                <span style={projectCalenderStyles.fieldName}>Description: </span>
                                <span style={projectCalenderStyles.fieldValue}>
                                    {selectedReminder.description}
                                </span>
                            </Col>
                        </Row>
                    </ModalPopup>
                ) : null}
            </div >
        );
    }, [currentReminders, REMINDER_TYPES_ICONS, isReminderModalVisible, isUpdatingReminder, isDeletingReminder]);

    const handleSetReminderBtnClick = useCallback(() => setShowCreateReminder(true), []);

    useEffect(() => {
        groupedReminders.length != 0 &&
            setCurrentReminders(
                mode === "month"
                    ? getRemindersForMonth(panelDate)
                    : getRemindersForYear(panelDate)
            );
    }, [groupedReminders, panelDate, mode]);

    useEffect(() => {
        isGetRemindersSuccessful &&
            setGroupedReminders(
                groupRemindersPayloadByDueDate(researchProjectReminderData)
            );
    }, [researchProjectReminderData, isGetRemindersSuccessful]);

    return showCreateReminder ? (
        <CreateReminderDialog setShowCreateReminder={setShowCreateReminder} researchTasks={tasks} reFetchReminders={reFetchReminders} />
    ) : (
        <>
            <div className="calendar-wrapper">
                {isProjectController ? (
                    < Row justify={'end'}>
                        <Tooltip title={researchProjectData.is_archived && projectArchiveDisableActionString}>
                            <span>
                                <Button
                                    id="set-reminder-btn"
                                    type="text"
                                    size="large"
                                    icon={<FontAwesomeIcon className="" icon={faClock} />}
                                    onClick={handleSetReminderBtnClick}
                                    disabled={researchProjectData.is_archived}
                                >
                                    Set Reminder
                                </Button>
                            </span>
                        </Tooltip>
                    </Row>
                ) : null}
                <Calendar
                    mode={mode}
                    dateCellRender={dateCellRenderer}
                    monthCellRender={monthCellRenderer}
                    onPanelChange={onPanelChange}
                />
            </div >
            <br />
            <div className="reminders-list-wrapper">
                <Typography.Title level={4}>Reminders</Typography.Title>
                {buildCurrentRemindersList()}
            </div>
        </>
    );
}

const projectCalenderStyles = {
    button: {
        filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
        backgroundColor: '#002E6D',
        width: '178px',
        height: '50px',
        borderRadius: '75px',
        fontWeight: 600,
        fontSize: '18px',
        color: '#FFFFFF'
    },
    reminderDetailsText: {
        fontSize: '17px',
    },
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
}
