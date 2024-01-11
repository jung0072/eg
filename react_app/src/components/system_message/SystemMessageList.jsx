import React from 'react'
import { Link } from 'react-router-dom';

import { Typography, Button, Space, Table } from "antd";

import { useUpdateSystemMessageMutation, useDeleteSystemMessageMutation } from '../../redux/services/adminAPI';

export default function SystemMessageList({ messageList, isAdmin }) {
    const [updateSystemMessage] = useUpdateSystemMessageMutation()
    const [deleteSystemMessage] = useDeleteSystemMessageMutation()

    const dataSource = messageList?.reduce((result, message) => {
        // When not admin, only show published messages
        if (!isAdmin && !message.is_published) {
            return result;
        }

        const data = {
            id: message.id,
            title: message.title,
            created_at: new Date(message.created_at).toLocaleDateString('en-CA'),
            type: message.type.replaceAll('[', '').replaceAll(']', '').replaceAll('\'', ''),
            is_published: message.is_published,
        };

        return [...result, data];
    }, []);


    const handleApprove = (id) => {
        const message = messageList.find((message) => message.id === id)
        updateSystemMessage({ messageData: { ...message, is_published: true }, messageId: id }).then(
            (apiResponse) => {
                const { error } = apiResponse;
                if (error) {
                    console.log("update systemMessage error:", error)
                }
                else {
                    // Show success message
                    openNotification({
                        type: 'success',
                        message: "Message Published Successfully",
                        description: `Your message has been published successfully. You will be redirected to the Blogs & News page in 5 seconds.`,
                        placement: 'topRight',
                        icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                        // callback: () => navigate('/system_message')
                    });
                }
            }
        )
    }

    const handleDelete = (id) => {
        deleteSystemMessage(id).then(
            (apiResponse) => {
                const { error } = apiResponse;
                if (error) {
                    console.log("delete systemMessage error:", error)
                } else {
                    localStorage.removeItem('systemMessage')
                    // Show success message
                    openNotification({
                        type: 'success',
                        message: "Message Deleted Successfully",
                        description: `Your message has been deleted successfully. You will be redirected to the Blogs & News page in 5 seconds.`,
                        placement: 'topRight',
                        icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                        callback: () => navigate('/system_message')
                    });
                }
            }
        )
    }

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => <Link to={`/system_message/${record.id}`} >{text}</Link>,
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
        },
        isAdmin && {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                if (!record.is_published) {
                    return (
                        <Space size='middle'>
                            <Button onClick={() => handleApprove(record.id)}>
                                Publish
                            </Button>
                        </Space>
                    )
                } else {
                    return (
                        <Space size='middle'>
                            <Button danger onClick={() => handleDelete(record.id)}>
                                Delete
                            </Button>
                        </Space>
                    )
                }
            },
        }
    ].filter(Boolean);

    return (
        <>
            <Typography.Title level={1}>Blogs & News</Typography.Title>
            <Table dataSource={dataSource} columns={columns} />
        </>
    )
}
