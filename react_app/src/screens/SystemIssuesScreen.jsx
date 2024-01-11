import { CaretDownOutlined, CaretUpOutlined, CheckCircleOutlined, LeftOutlined } from '@ant-design/icons';
import { Checkbox, Col, Form, Image, Layout, Row, Select, Table, Typography } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { compareDjangoDates, EngageSpinner, openNotification, renderFormErrors } from '../components/utils';
import { useGetContactLogQuery } from '../redux/services/authAPI';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import { selectLoggedInUserData } from '../redux/services/userAPI';
import { useEngageStylingLayout } from '../providers/EngageLayoutStylingContextProvider';
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { ContactLogActionTypes, ContactLogPriorityTypes, MENU_ROUTES } from "../components/utils/constants";
import { useUpdateContactLogRequestMutation } from "../redux/services/adminAPI";
import { UnauthenticatedFooter, UnauthenticatedHeader } from "../components/unauthenticated";

const DEFAULT_SYSTEM_ISSUES_COLUMNS = [
    {
        title: 'Issue Type',
        dataIndex: 'enquiry_type',
        key: 'enquiry_type',
        sorter: (a, b) => a.enquiry_type.localeCompare(b.enquiry_type),
    },
    {
        title: 'Submission Date',
        dataIndex: 'created_at',
        key: 'created_at'
    },
    {
        title: 'Issue from Screen',
        dataIndex: 'support_screen',
        key: 'support_screen',
        sorter: (a, b) => a.support_screen.localeCompare(b.support_screen),
    },
    {
        title: 'Screenshot',
        dataIndex: 'screenshot',
        key: 'screenshot',
        sorter: (a, b) => (b.hasScreenshot - a.hasScreenshot),
        sortDirections: ['ascend', 'descend'],
        render: (screenshot, record) => (record.screenshot)
            ? (<Image
                src={`data:image/png;base64, ${screenshot}`}
                alt={"The screenshot for this contact log"}
                width={100}
            />)
            : null
    },
];

export default function SystemIssuesScreen({ isUserAuthenticated }) {
    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);
    const userInfo = useSelector(selectLoggedInUserData);
    const {
        data: systemIssues,
        isLoading: isLoadingLogs,
        isSuccess,
    } = useGetContactLogQuery();
    const [updateContactLogRequest, { isLoading: isLoadingContactLogRequest }] = useUpdateContactLogRequestMutation();

    const navigate = useNavigate();

    // set the initial field for the systemLogs
    const [isAdmin, setIsAdmin] = useState(false);
    const [logsData, setLogsData] = useState([]);

    // useEffect hook to handle the component did mount lifecycle event
    useEffect(() => {
        if (isUserAuthenticated) {
            // remove the padding
            removeLayoutPadding(false);
            // remove the white background color
            changeBackgroundColor(false);
            // set the navigation
            updateActiveNavigationMenu(MENU_ROUTES[6].key);
        }
    }, []);

    // check if we have system issues and check for the query success if true
    // check for admin, if it's admin setIsAdmin to true to display extra fields
    // if there is no user info redirect user to the unauthorized system issues
    useEffect(() => {
        if (isSuccess && systemIssues) {
            setIsAdmin(systemIssues.admin);
            setLogsData(systemIssues.logs);
        }
        if (!userInfo) {
            navigate('/contact_us/system_issue/');
        }
    }, [systemIssues, setIsAdmin, setLogsData, userInfo]);

    const handleUpdateContactLogRequest = (contactLogID, requestBody) => {
        // Find the index of the record with the specified contactLogID
        const recordIndex = logsData.findIndex((record) => record.key === contactLogID);
        const updatedLogsData = [...logsData];
        if (recordIndex > -1) {
            // Now with the front-end updated we can fire off the request to the backend
            updateContactLogRequest({
                contactLogID: contactLogID,
                contactLogRequestBody: requestBody
            }).then(({ data, error }) => {
                if (error) {
                    renderFormErrors(error, null, "Error Saving Contact Log Request");
                } else if (data) {
                    // Update the is_complete field for the specific record and then update state with the new data
                    updatedLogsData.splice(recordIndex, 1, {
                        ...updatedLogsData[recordIndex],
                        ...requestBody
                    });
                    setLogsData(updatedLogsData);

                    // Now show a toast notification to the admin
                    openNotification({
                        placement: 'topRight',
                        message: 'Contact Log Request Updated',
                        description: `We have successfully updated the request of the contact log: ${data?.data?.id}`,
                        icon: <CheckCircleOutlined style={{ color: 'green' }} />
                    });
                }
            }).catch(err => console.error("There was an error updating this contact log", err));
        }
    };

    const systemIssueColumns = [...DEFAULT_SYSTEM_ISSUES_COLUMNS];
    if (isAdmin) {
        // First add the username and email address columns to the appropriate locations
        systemIssueColumns.splice(3, 0,
            {
                title: 'Name',
                dataIndex: 'username',
                key: 'username',
                sorter: (a, b) => a.username.localeCompare(b.username),
            },
            {
                title: 'Email address',
                dataIndex: 'email_address',
                key: 'email_address',
                sorter: (a, b) => a.email_address.localeCompare(b.email_address),
            }
        );

        // Now add in the task tracking columns for each contact log request
        systemIssueColumns.push(
            {
                title: 'Last Updated',
                dataIndex: 'updated_at',
                key: 'updated_at',
                sorter: (a, b) => compareDjangoDates(a.updated_at, b.updated_at),
                render: (updatedAt) => new Date(updatedAt).toLocaleString()
            },
            {
                title: 'Action Stage',
                dataIndex: 'action_stage',
                key: 'action_stage',
                sorter: (a, b) => a.action_stage.localeCompare(b.action_stage),
                filters: Object.entries(ContactLogActionTypes).map(entry => ({ value: entry[0], text: entry[1] })),
                onFilter: (value, record) => record.action_stage.indexOf(value) === 0,
                render: (actionStage, record) => (
                    <Form.Item label={''} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} style={{ marginBottom: 0 }}
                        name="action_stage">
                        <Select
                            defaultValue={ContactLogActionTypes[actionStage]}
                            onChange={(event) => handleUpdateContactLogRequest(record.key, { action_stage: event })}
                            options={Object.entries(ContactLogActionTypes).map((type) => ({
                                value: type[0],
                                label: type[1]
                            }))}
                        />
                    </Form.Item>
                )
            },
            {
                title: 'Priority',
                dataIndex: 'priority',
                key: 'priority',
                sorter: (a, b) => a.priority.localeCompare(b.priority),
                filters: Object.entries(ContactLogPriorityTypes).map(entry => ({ value: entry[0], text: entry[1] })),
                onFilter: (value, record) => record.priority.indexOf(value) === 0,
                render: (priority, record) => (
                    <Form.Item label={''} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} style={{ marginBottom: 0 }}
                        name="priority">
                        <Select
                            defaultValue={ContactLogPriorityTypes[priority]}
                            onChange={(event) => handleUpdateContactLogRequest(record.key, { priority: event })}
                            options={Object.entries(ContactLogPriorityTypes).map((type) => ({
                                value: type[0],
                                label: type[1]
                            }))}
                        />
                    </Form.Item>
                )
            },
            {
                title: 'Completed',
                dataIndex: 'is_complete',
                key: 'is_complete',
                align: 'center',
                sorter: (a, b) => a.is_complete - b.is_complete,
                render: (isComplete, record) => <Checkbox checked={isComplete}
                    onChange={(event) => handleUpdateContactLogRequest(record.key, { is_complete: event.target.checked })}
                />
            }
        );
    }

    if (isLoadingLogs) {
        return <EngageSpinner display="full" />;
    }

    const handleBackButton = () => {
        navigate(userInfo ? '/app/contact_us/' : '/contact_us/');
    };

    return (
        <>
            {userInfo ? null : <UnauthenticatedHeader />}
            <Layout style={{ minHeight: '82vh', padding: (userInfo) ? 0 : '1em' }}>
                <Row
                    justify={'space-between'}
                    style={systemIssuesStyle.headingSystemIssue}
                >
                    <Col>
                        <Typography.Title style={systemIssuesStyle.title}>
                            System Issues
                        </Typography.Title>
                        <Typography.Text>
                            View reported issues to the Engage Platform here. If you would like to report an issue
                            <Link to="/contact_us/"> Click Here</Link>
                        </Typography.Text>
                    </Col>
                    <Col>
                        <div onClick={handleBackButton} style={systemIssuesStyle.backButton}>
                            <LeftOutlined style={systemIssuesStyle.backIcon} />
                        </div>
                    </Col>
                </Row>
                <Row style={systemIssuesStyle.tableContainer}>
                    <Col span={24}>
                        <Table
                            pagination={false}
                            columns={systemIssueColumns}
                            dataSource={logsData}
                            size={"small"}
                            expandable={{
                                expandedRowRender: (record) => (
                                    <p style={{ margin: 0 }}>
                                        {record.message}
                                    </p>
                                ),
                                expandIcon: ({ expanded, onExpand, record }) =>
                                    expanded ? (
                                        <Row style={systemIssuesStyle.iconWrapper}>
                                            <CaretUpOutlined
                                                onClick={(e) => onExpand(record, e)}
                                            />
                                        </Row>
                                    ) : (
                                        <Row style={systemIssuesStyle.iconWrapper}>
                                            <CaretDownOutlined
                                                onClick={(e) => onExpand(record, e)}
                                            />
                                        </Row>
                                    ),
                            }}
                        />
                    </Col>
                </Row>
            </Layout>
            {userInfo ? null : <UnauthenticatedFooter />}
        </>
    );
}

const systemIssuesStyle = {
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
    }
};
