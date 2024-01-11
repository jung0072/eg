import React, { useContext, useEffect, useState } from 'react';

import { CaretDownOutlined, CaretUpOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Checkbox, Col, Row, Table, Typography } from 'antd';

import { useEngageStylingLayout } from '../providers/EngageLayoutStylingContextProvider';
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";

import { useUpdateEngageReportMutation, useGetEngageReportQuery } from "../redux/services/engageReportsAPI";

import { compareDjangoDates, EngageSpinner, openNotification, EngageComments, ModalPopup } from '../components/utils';
import { EngageReportTypes } from '../components/utils/constants';
import { Link } from 'react-router-dom';

const { Title } = Typography

export default function EngageReportsScreen({ isUserAuthenticated }) {
    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);
    // rtk queries for post and get request
    const [updateEngageReport, { isLoading: isUpdatingAdminComment }] = useUpdateEngageReportMutation();
    const { data: engageReports, isLoading: isLoadingEngageReports, isSuccess } = useGetEngageReportQuery();
    // state to handle the comment box
    const [addComment, setAddComment] = useState({ active: false, itemIndex: null });
    // state for engage reports data
    const [reportsData, setReportsData] = useState([]);
    // action stage to tell what comment box action is doing
    const [commentActionStates, setCommentActionStates] = useState({ adding: false, editing: false, deleting: false, index: null });

    const [isMessageReport, setIsMessageReport] = useState({ active: false, data: null })
    const discussionBoardData = isMessageReport?.data?.discussion_board_data;
    const parentMessageDetails = isMessageReport?.data?.parent_message_detail;

    useEffect(() => {
        if (isUserAuthenticated) {
            // remove the padding
            removeLayoutPadding(false);
            // remove the white background color
            changeBackgroundColor(false);
            // set the navigation
            updateActiveNavigationMenu(MENU_ROUTES[7].key);
        }
        if (isSuccess) {
            setReportsData(engageReports);
        }
    }, [engageReports, setReportsData]);

    if (isLoadingEngageReports) {
        return <EngageSpinner display="full" />;
    };

    // column for report table
    const engageReportsColumn = [
        {
            title: 'ID',
            dataIndex: 'key',
            key: 'key',
            sorter: (a, b) => a.key - b.key,
        },
        {
            title: 'Reported By',
            dataIndex: 'reporter',
            key: 'reporter',
            sorter: (a, b) => a.reporter.first_name.localeCompare(b.reporter.first_name),
            render: (reporter) => <>{reporter.first_name} {reporter.last_name}</>
        },
        {
            title: 'Submission Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (created_at) => new Date(created_at).toLocaleString(),
        },
        {
            title: 'Last Updated',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (updated_at) => new Date(updated_at).toLocaleString(),
            sorter: (a, b) => compareDjangoDates(a.updated_at, b.updated_at),
        },
        {
            title: 'Reported Item',
            dataIndex: 'reported_item',
            key: 'reported_item',
            render: (reported_item, record) => {
                if (reported_item?.message) {
                    return <Link to={'#'} onClick={() => setIsMessageReport({ active: true, data: reported_item })}>Show Message</Link>
                } else if (reported_item?.file_name) {
                    return <Link to={reported_item?.task_link}>View Task for File: {reported_item?.file_name}</Link>
                }
                else {
                    return <Link to={reported_item}>View {record.report_type[0].toUpperCase()+record.report_type.slice(1).toLowerCase()}</Link>
                }
            }
        },
        {
            title: 'Report Type',
            dataIndex: 'report_type',
            key: 'report_type',
            sorter: (a, b) => a.report_type.localeCompare(b.report_type),
            filters: Object.entries(EngageReportTypes).map(entry => ({ value: entry[0], text: entry[1] })),
            onFilter: (value, record) => record.report_type.indexOf(value) === 0,
            render: (report_type) => <>{EngageReportTypes[report_type]}</>
        },
        {
            title: 'Mark Resolved',
            dataIndex: 'is_resolved',
            key: 'is_resolved',
            align: 'center',
            filters: [
                { text: 'Resolved', value: true },
                { text: 'Unresolved', value: false },
            ],
            filterMultiple: false,
            sorter: (a, b) => a.is_resolved - b.is_resolved,
            render: (isResolved, record) => <Checkbox checked={isResolved}
                onChange={(event) => handleUpdateEngageReports(record.key, { is_resolved: event.target.checked })}
            />,
            onFilter: (value, record) => record.is_resolved === value,
        },
    ];

    const toggleCommentsBox = (isOpen, index) => {
        setAddComment({
            ...addComment,
            active: isOpen,
            itemIndex: index,
        });
        if (isOpen === false) {
            setCommentActionStates({ ...commentActionStates, adding: false, editing: false, deleting: false, index: null });
        }
    };

    // rtk query to handle comment create/update
    const handleUpdateEngageReports = (engageReportID, requestBody) => {
        // Find the index of the record with the specified engageReportID
        const recordIndex = reportsData.findIndex((record) => record.key === engageReportID);

        const updatedLogsData = [...reportsData];
        if (recordIndex > -1) {
            // Now with the front-end updated we can fire off the request to the backend
            updateEngageReport({
                engageReportID: engageReportID,
                engageReportRequestBody: requestBody
            }).then(({ data, error }) => {
                if (error) {
                    openNotification({
                        placement: 'topRight',
                        message: 'Error Updating Report',
                        description: `${error?.data.error}`,
                        icon: <CloseCircleOutlined style={{ color: 'red' }} />
                    });
                } else if (data) {
                    // Update the is_complete field for the specific record and then update state with the new data
                    updatedLogsData.splice(recordIndex, 1, {
                        ...updatedLogsData[recordIndex],
                        ...requestBody
                    });
                    setReportsData(updatedLogsData);
                    if (requestBody?.admin_comments) {
                        setAddComment({ ...addComment, active: false, itemIndex: null })
                    }
                    // Now show a toast notification to the admin
                    openNotification({
                        placement: 'topRight',
                        message: 'Contact Log Request Updated',
                        description: `${data?.success}`,
                        icon: <CheckCircleOutlined style={{ color: 'green' }} />
                    });
                }
            }).catch(err => console.error("There was an error updating this contact log", err));
        }
    };

    // action buttons for user comment
    const userCommentActions = (index) => [
        <span
            onClick={() => {
                toggleCommentsBox(true, index);
                setCommentActionStates({ ...commentActionStates, adding: true, editing: false, deleting: false, index: index });
            }}
        >
            Add comment
        </span>,
    ];

    // action buttons for admin comment
    const adminCommentActions = (index, record) => [
        <span
            onClick={() => {
                toggleCommentsBox(true, index)
                setCommentActionStates({ ...commentActionStates, adding: false, editing: true, deleting: false, index: index + 1 });
            }}
        >
            Edit
        </span>,
        <span
            onClick={() => {
                handleUpdateEngageReports(record.key, { admin_comments: null })
                setCommentActionStates({ ...commentActionStates, adding: false, editing: false, deleting: true, index: index + 1 });
            }}
        >
            Delete
        </span>,
    ];

    return (
        <>
            <Row
                justify={'space-between'}
                style={engageReportsStyle.headingSystemIssue}
            >
                <Col>
                    <Typography.Title style={engageReportsStyle.title}>
                        Engage Reports
                    </Typography.Title>
                    <Typography.Text>
                        Explore profiles, projects, tasks, and files reported by users.
                    </Typography.Text>
                </Col>
            </Row>
            <Row style={engageReportsStyle.tableContainer}>
                <Col span={24}>
                    <Table
                        size={'middle'}
                        rowKey={record => record.key}
                        pagination={{ pageSize: 10 }}
                        columns={engageReportsColumn}
                        dataSource={reportsData}
                        expandable={{
                            expandedRowRender: (record, index) => {
                                const adminComment = record.admin_comments;
                                const actionWithRowIndexing = addComment.active && index === addComment.itemIndex
                                return (
                                    <div>
                                        <EngageComments
                                            actions={adminComment ? null : userCommentActions(index)}
                                            commentContent={record.user_comment}
                                            isAddingWithIndex={actionWithRowIndexing && commentActionStates.adding}
                                            closeCommentBox={() => toggleCommentsBox(false, null)}
                                            authorData={record.reporter}
                                            loadingAddComment={isUpdatingAdminComment}
                                            commentBoxProps={{ rows: 3 }}
                                            commentActionStates={commentActionStates}
                                            showCommentAuthor
                                            handleComment={(commentBoxContent) => handleUpdateEngageReports(record.key, { admin_comments: commentBoxContent })}
                                            commentKey={index}
                                        >
                                            {
                                                adminComment && <EngageComments
                                                    isEditingWithIndex={actionWithRowIndexing && commentActionStates.editing}
                                                    actions={adminCommentActions(index, record)}
                                                    commentContent={adminComment}
                                                    loadingAddComment={isUpdatingAdminComment}
                                                    commentActionStates={commentActionStates}
                                                    closeCommentBox={() => toggleCommentsBox(false, null)}
                                                    handleComment={(commentBoxContent) => handleUpdateEngageReports(record.key, { admin_comments: commentBoxContent })}
                                                    commentKey={index + 1}
                                                />
                                            }
                                        </EngageComments>
                                    </div>
                                )
                            },
                            columnWidth: 150,
                            expandIcon: ({ expanded, onExpand, record }) =>
                                expanded ? (
                                    <div style={engageReportsStyle.toggleComments} onClick={(e) => onExpand(record, e)}>
                                        <CaretUpOutlined />
                                        Close Comments
                                    </div>
                                ) : (
                                    <div style={engageReportsStyle.toggleComments} onClick={(e) => onExpand(record, e)}>
                                        <CaretDownOutlined />
                                        Show Comments
                                    </div>
                                ),
                        }}
                    />
                </Col>
            </Row>
            {isMessageReport.active && (
                <ModalPopup
                    title="Reported Message Information"
                    visible={isMessageReport.active}
                    handleCancel={() => setIsMessageReport({ active: false, data: null })}
                    type="info"
                    disableScreenTouch={false}
                    centered={true}
                    width={850}
                >
                    <Row style={{ marginBottom: '1rem' }}>
                        <Col span={24} style={engageReportsStyle.fieldName}>Message: </Col>
                        <Col span={24} style={engageReportsStyle.fieldValue}>
                            <q>{isMessageReport.data.message}</q>
                        </Col>
                    </Row>
                    <Row align={'center'} justify={"center"}>

                        <Col span={12}>
                            <Title level={5}> Discussion Board:</Title>

                            <Col span={24} style={engageReportsStyle.messageInfoSectionStyle}>
                                {discussionBoardData?.task_id ? (
                                    <Row>
                                        <>
                                            <span style={engageReportsStyle.fieldName}>Task: </span>
                                            <Link to={`/app/research_task/${discussionBoardData?.task_id}`} style={engageReportsStyle.fieldValue}>
                                                {discussionBoardData?.task_title}
                                            </Link>
                                        </>

                                    </Row>
                                ) : null}
                                <Row>
                                    <span style={engageReportsStyle.fieldName}>Project: </span>
                                    <Link to={`/app/research_study/${discussionBoardData?.project_id}`} style={engageReportsStyle.fieldValue}>
                                        {discussionBoardData?.project_title}
                                    </Link>
                                </Row>
                            </Col>
                        </Col>
                        <Col span={12}>
                            <Title level={5}>Message Info:</Title>
                            <Col span={24} style={engageReportsStyle.messageInfoSectionStyle}>
                                <Row>
                                    <span style={engageReportsStyle.fieldName}>Sender: </span>
                                    <Link to={isMessageReport.data.profile_link} style={engageReportsStyle.fieldValue}>
                                        {isMessageReport.data.sender_name}
                                    </Link>
                                </Row>
                                {parentMessageDetails && Object.keys(parentMessageDetails).length > 0 && <Row>
                                    <span style={engageReportsStyle.fieldName}>Replied To User: </span>
                                    <Link to={parentMessageDetails?.profile_link} style={engageReportsStyle.fieldValue}>
                                        {parentMessageDetails?.sender_name}
                                    </Link>
                                </Row>}
                            </Col>
                        </Col>
                    </Row >
                </ModalPopup >
            )
            }
        </>
    );
}

const engageReportsStyle = {
    iconWrapper: {
        height: 'auto',
        width: 'auto',
        border: '1.8px solid #F2F4F4',
        textAlign: 'center',
        padding: '0.2em',
        borderRadius: '6px',
        boxShadow: '0px 0px 9px 3px #F2F4F4',
    },
    tableContainer: {
        marginTop: '1em',
    },
    headingSystemIssue: {
        padding: '1em',
    },
    title: {
        fontWeight: 'bold',
        fontSize: '1.7em',
        color: 'var(--primary-color-1)',
    },
    backButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50px',
        width: '50px',
        borderRadius: '50%',
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 0px 8px #717171',
        cursor: 'pointer',
    },
    backIcon: {
        fontSize: '2.5em',
        color: 'var(--primary-color-1)'
    },
    toggleComments: {
        display: 'flex',
        cursor: 'pointer',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 'bold',
    },
    closeCommentBox: {
        fontSize: '1.4rem',
        marginBottom: '0.4rem',
        display: 'inherit',
        textAlign: 'end',
    },
    userDeleteTitle: {
        fontSize: '1.2em',
        color: 'var(--primary-color-1)',
    },
    fieldName: {
        fontSize: '1.1em',
        fontWeight: 'bold',
        marginRight: '4px',
    },
    fieldValue: {
        fontSize: '1.1em',
    },
    messageInfoSectionStyle: {
        display: 'flex',
        gap: '1rem',
        flexDirection: 'column',
        padding: '0 0.6rem',
    }
};
