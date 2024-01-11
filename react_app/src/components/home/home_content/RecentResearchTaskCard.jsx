import React from "react";
import { Card, Col, Row } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useUserRecentResearchTasksQuery } from '../../../redux/services/researchProjectAPI.js';
import './recent_research_task_card.css';
import { Link } from "react-router-dom";
import { Colours, EngageSpinner } from "../../utils";
import { renderTaskDueDate } from "../../utils/common";

/**
 *
 * @returns The layout for due tasks
 * @todo integrating it with the api
 */
export default function RecentResearchTaskCard({ researchProjectID }) {

    // depending on the windows width we can request more data from the api for components
    // const { height, width } = useWindowsDimensions();
    const {
        data: usersRecentResearchTaskData,
        isLoading: isLoadingUsersRecentResearchTaskData
    } = (researchProjectID) ? useUserRecentResearchTasksQuery({ researchProjectID }) : {};

    if (researchProjectID === null) {
        return (
            <>
                <Col
                    span={12}
                    style={{ fontSize: '16px', lineHeight: '42px', color: '#949494' }}
                >
                    Your Recent Tasks
                </Col>
                <div
                    style={{
                        width: '100%',
                        height: '150px',
                        marginBottom: '1em',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '18px'
                    }}
                >
                    Please select or join a project to view your recent tasks for this project
                </div>
            </>
        );
    }

    let displayedRecentResearchTaskContent;
    let completedTasksLabel = (
        <>
            <div>Research Tasks</div>
            <span>Loading...</span>
        </>
    );

    if (isLoadingUsersRecentResearchTaskData) {
        displayedRecentResearchTaskContent = (
            <div style={{
                height: '100px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%'
            }}>
                <EngageSpinner useBackground={false} loaderText={"Loading Recent Tasks..."} />
            </div>
        );
    } else if (!usersRecentResearchTaskData) {
        displayedRecentResearchTaskContent = (
            <div>Join a project and get assigned to a task to see the recent tasks here.</div>
        );
        completedTasksLabel = (
            <>
                <div>Research Tasks</div>
                <span>None</span>
            </>
        );
    } else if (usersRecentResearchTaskData.length === 0) {
        displayedRecentResearchTaskContent = (
            <div>You currently do not have any assigned tasks for this project</div>
        );
        completedTasksLabel = (
            <>
                <div>Research Tasks</div>
                <span>No Tasks Assigned</span>
            </>
        );
    } else {
        let recentTaskDataList = usersRecentResearchTaskData.map((item, idx) => ({
            taskNumber: idx + 1,
            key: item.assigned_user_info.id,
            task_id: item.task.task_id,
            title: item.task.title,
            dueDate: new Date(item.task.due_date),
            dueStatus: item.task.due_status,
            isComplete: item.assigned_user_info.is_complete,
        }));

        // Commented out until we implement specific count requests
        // // if width is more than 1570px we can req more items from api concat them to the main Recent Item
        // if (width >= 1570 && recentTask.length < 6) {
        //     recentTask.push(...reqMoreRecentTask);
        // } else if (width < 1570) {
        //     // reset it to starting 3 task by filtering out the new one
        //     recentTask = recentTask.filter((el) => !reqMoreRecentTask.find((rem) => rem.taskNumber === el.taskNumber));
        // }
        displayedRecentResearchTaskContent = recentTaskDataList.slice(0, 5).map((data, index) => {
            return (
                <Link to={`/app/research_task/${data.task_id}/`} key={index}>
                    <div style={{ display: "flex" }}>
                        <Card hoverable={true} key={index} className="recent-items-card">
                            <div className="card-heading">{data.title}</div>
                            <div className="card-due-date">Due: {data.dueDate.toDateString()}</div>
                            {
                                (data.isComplete)
                                    ? <span style={{ color: Colours.SUCCESS }}>Completed <CheckOutlined /></span>
                                    : renderTaskDueDate(data.dueStatus)
                            }
                        </Card>
                    </div>
                </Link>
            );
        });

        // now find out how many tasks the user has completed by iterating over a list
        let completedTasksCount = usersRecentResearchTaskData.reduce((accumulator, current) => {
            return (current.assigned_user_info.is_complete)
                ? accumulator + 1
                : accumulator;
        }, 0);
        let totalTasksCount = usersRecentResearchTaskData.length;
        completedTasksLabel = (
            <>
                <div>Completed Tasks</div>
                <span>{`${completedTasksCount}/${totalTasksCount}`}</span>
            </>
        );
    }

    return (
        <Col span={22} className="recent-items">
            <Row justify={"space-between"}>
                <Col className="recent-task-title" span={12}>Your Recent Tasks</Col>
                <Col className="task-completed" span={12}>
                    {completedTasksLabel}
                </Col>
            </Row>
            <div className="cards-box">
                {displayedRecentResearchTaskContent}
            </div>
        </Col>
    );
}
