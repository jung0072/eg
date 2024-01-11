import React, { useCallback, useEffect, useState } from 'react';
import { Button, Layout, Row, Space, Table, Typography } from 'antd';
import { useGetResearchInterestCategoriesQuery } from "../../../../redux/services/adminAPI";
import ResearchInterestCategoryFormModal from "./ResearchInterestCategoryFormModal";
import ResearchInterestOptionsFormModal from "./ResearchInterestOptionsFormModal";
import { PlusCircleOutlined } from "@ant-design/icons";
import { set } from "immutable";

const { Text, Title, Paragraph } = Typography;

export default function ResearchInterestFormManagement({}) {
    const [displayedResearchCategories, setDisplayedResearchCategories] = useState([]);
    const [categoryFormRequest, setCategoryFormRequest] = useState({
        visible: false,
        categoryID: null,
        isAdding: true
    });
    const [optionsFormRequest, setOptionsFormRequest] = useState({
        visible: false,
        categoryID: null
    });
    const {
        data: researchInterestCategories,
        isLoading: isLoadingResearchInterestCategories
    } = useGetResearchInterestCategoriesQuery();

    const handleEditCategoryClick = useCallback((categoryID) => setCategoryFormRequest({
        visible: true,
        isAdding: false,
        categoryID
    }), [setCategoryFormRequest]);

    const handleEditOptionsTreeClick = useCallback((categoryID) => setOptionsFormRequest({
        visible: true,
        categoryID
    }), [setOptionsFormRequest]);

    const handleAddOptionCategoryClick = useCallback(() => setCategoryFormRequest({
        visible: true,
        isAdding: true,
        categoryID: null
    }));

    // useEffect callback to set the research interest once they are received from the backend
    useEffect(() => setDisplayedResearchCategories(researchInterestCategories), [researchInterestCategories]);

    if (isLoadingResearchInterestCategories) {
        return (<div>Loading...</div>);
    }

    // Create the columns for the research interests category column
    const categoryTableColumns = [
        {
            title: 'Category Name',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (description) => (<Paragraph ellipsis={{ expandable: true, rows: 2 }}>{description}</Paragraph>)
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: 'Last Updated',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: (
                <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                    <Text>Action</Text>
                    <Button
                        onClick={handleAddOptionCategoryClick}
                        type="info"
                        style={{ marginLeft: 'auto' }}
                        icon={<PlusCircleOutlined />}
                    >
                        Add
                    </Button>
                </div>
            ),
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button type="info" onClick={() => handleEditCategoryClick(record.id)}>
                        Edit Category
                    </Button>
                    <Button type="info" onClick={() => handleEditOptionsTreeClick(record.id)}>
                        Edit Options
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <Layout>
            <Row>
                <Title level={3}>Research Interest Form Management</Title>
            </Row>
            <Row align={"middle"} justify={"center"}>
                <Table
                    pagination={false}
                    dataSource={displayedResearchCategories}
                    columns={categoryTableColumns}
                    size={"large"}
                />
            </Row>
            <ResearchInterestCategoryFormModal
                categoryData={displayedResearchCategories}
                setDisplayedResearchCategories={setDisplayedResearchCategories}
                isVisible={categoryFormRequest.visible}
                categoryID={categoryFormRequest.categoryID}
                isAdding={categoryFormRequest.isAdding}
                setIsVisible={(value) => setCategoryFormRequest((previous) => ({ ...previous, visible: value }))}
            />
            <ResearchInterestOptionsFormModal
                categoryData={displayedResearchCategories}
                isVisible={optionsFormRequest.visible}
                categoryID={optionsFormRequest.categoryID}
                setIsVisible={(value) => setOptionsFormRequest((previous) => ({ ...previous, visible: value }))}
            />
        </Layout>
    );
}
