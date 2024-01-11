import React, { useState } from 'react';
import { Button, Form, Input, Row, Typography } from 'antd';

import { usePostEngageReportMutation } from "../../../redux/services/engageReportsAPI";
import { openNotification } from '../common';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useEngageAction } from '../../../providers/EngageActionContextProvider';

const { Title } = Typography;

const ReportItem = ({
    reportData,
    reportingItemText,
    callbackCancelButton,
    callbackReportButton,
}) => {
    const [userComment, setUserComment] = useState();
    const [submitReport, { isLoading }] = usePostEngageReportMutation();
    const [status, setStatus] = useState(null);
    const { toggleShowMenuOptions, setAssociatedWithID } = useEngageAction();

    const handleReportPost = () => {
        if (!userComment || userComment.trim() === "") {
            setStatus("error");
        } else {
            const engageReportRequestBody = {
                user_comment: userComment,
                object_id: reportData.id,
                report_type: reportData.type,
            };

            submitReport({ engageReportRequestBody }).then((data) => {
                if (data?.data?.success) {
                    openNotification({
                        type: 'success',
                        message: "Report Submitted Successfully",
                        description: data?.data?.success,
                        placement: 'topRight',
                        icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                    });
                }
                toggleShowMenuOptions(false);
                setAssociatedWithID(null);
            }).catch((err) => console.log(err));
        }
    };

    return (
        <div>
            {reportingItemText && <Title level={5}>{reportingItemText}</Title>}
            <Form.Item style={{marginBottom: '12px'}}>
                <Input.TextArea 
                    status={status}
                    placeholder={`Please provide more details about why this ${reportData.type.toLowerCase()} is malicious/inappropriate/reportable`}
                    rows={3}
                    onChange={(e) => setUserComment(e.target.value)}
                    style={{resize: 'both'}}
                />
            </Form.Item>
            <Form.Item style={{marginBottom: '12px'}}>
                <Row style={reportItemStyle.commentButtonActionContainer}>
                    <Button
                        icon={<CloseCircleOutlined style={{color: 'black'}} />}
                        type="info"
                        style={reportItemStyle.reportButtons}
                        onClick={() => {
                            if (callbackCancelButton) {
                                callbackCancelButton();
                            }
                            setAssociatedWithID(null);
                            toggleShowMenuOptions(false);
                        }}
                        >
                        Cancel
                    </Button>
                    <Button
                        icon={<ExclamationCircleOutlined style={{color: 'red'}} />}
                        loading={isLoading}
                        type="info"
                        style={reportItemStyle.reportButtons}
                        onClick={() => {
                            if (callbackReportButton) {
                                callbackReportButton();
                            }
                            handleReportPost();
                        }}
                        >
                        Report
                    </Button>
                </Row>
            </Form.Item>
        </div>
    )
}

const reportItemStyle = {
    commentButtonActionContainer: {
        display: 'flex',
        gap: '1rem',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    reportButtons: {
        borderRadius: '4px',
    }
}

export default ReportItem;
