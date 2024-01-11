import React, { useState, useEffect, useCallback } from 'react';
import { useUserProfileQuestionsQuery } from "../../../../redux/services/adminAPI";
import { Button, Row, Select, Table, Typography } from "antd";
import UserProfileQuestionModal from "./UserProfileQuestionModal";
import { PlusCircleOutlined } from "@ant-design/icons";


const questionTextOptions = {
    RESEARCHER: 'text_for_researcher',
    PATIENT: 'text_for_patient',
    FAMILY: 'text_for_family_of_patient',
    CARETAKER: 'text_for_caretaker_of_patient',
    PASSIVE: 'text_for_passive',
};
export default function CustomizeUserProfileForms() {
    const {
        data: userProfileQuestionData,
        isLoading: isLoadingUserProfileQuestionData
    } = useUserProfileQuestionsQuery();
    const [viewedUserRole, setViewedUserRole] = useState(questionTextOptions.RESEARCHER);
    const [selectedQuestionID, setSelectedQuestionID] = useState(null);
    const [isQuestionModalVisible, setQuestionModalVisible] = useState(false);
    const [questionColumns, setQuestionColumns] = useState([
        {
            title: '#',
            dataIndex: 'order_number',
            key: 'order_number',
        },
        {
            title: 'Question',
            dataIndex: viewedUserRole,
            key: 'label',
            width: '20%'
        },
        {
            title: 'Type',
            dataIndex: 'question_type',
            key: 'question_type',
        },
        {
            title: 'Section',
            dataIndex: 'section_name',
            key: 'section_name',
            sorter: (a, b) => a.section_name.localeCompare(b.section_name),
            onFilter: (value, record) => record.section_name.indexOf(value) === 0,
            filters: userProfileQuestionData?.sections.map(section => ({ value: section.name, text: section.name }))
        },
        {
            title: 'Action',
            dataIndex: 'id',
            key: 'action',
            render: (id, record, index) => (
                <Button
                    data-question-id={id}
                    key={index}
                    onClick={() => {
                        setQuestionModalVisible(true);
                        setSelectedQuestionID(record.id);
                    }}
                >
                    Edit
                </Button>
            )
        },
    ]);

    // callback function to handle when the admin changes which user role they are viewing the questions as
    const handleChangeUserRole = useCallback(
        (event) => setViewedUserRole(event),
        [userProfileQuestionData, setViewedUserRole]
    );

    // callback function to handle when the admin clicks add question
    const handleAddQuestion = useCallback(() => {
        setSelectedQuestionID(null);
        setQuestionModalVisible(true);
    }, [setSelectedQuestionID, setQuestionModalVisible]);

    // useEffect hook to update the question label shown in the question column
    useEffect(() => {
        setQuestionColumns((previous) => {
            previous[1]["dataIndex"] = viewedUserRole;
            return previous;
        });
    }, [userProfileQuestionData, viewedUserRole, setQuestionColumns]);

    return (
        <div>
            <Typography.Title>Customize User Profile Questions</Typography.Title>
            <Row>
                <Select
                    onChange={handleChangeUserRole}
                    defaultValue={questionTextOptions.RESEARCHER}
                    style={{ marginBottom: '1em' }}
                    options={[
                        {
                            value: questionTextOptions.RESEARCHER,
                            label: "View Questions as Researcher",
                            key: 'text_for-0'
                        },
                        { value: questionTextOptions.PATIENT, label: "View Questions as Patient", key: 'text_for-1' },
                        {
                            value: questionTextOptions.FAMILY,
                            label: "View Questions as Family of Patient",
                            key: 'text_for-2'
                        },
                        {
                            value: questionTextOptions.CARETAKER,
                            label: "View Questions as Caretaker of Patient",
                            key: 'text_for-3'
                        },
                        {
                            value: questionTextOptions.PASSIVE,
                            label: "View Questions as a Passive User",
                            key: 'text_for-4'
                        },
                    ]}
                />
                <Button
                    type={"primary"}
                    style={{ marginLeft: 'auto' }}
                    icon={<PlusCircleOutlined />}
                    onClick={handleAddQuestion}
                >
                    Add Question
                </Button>
            </Row>
            <Table
                dataSource={userProfileQuestionData?.questions?.map((question, index) => ({
                    ...question,
                    key: `question-${index}`
                }))}
                columns={questionColumns}
                loading={isLoadingUserProfileQuestionData}
            />
            <UserProfileQuestionModal
                setIsVisible={setQuestionModalVisible}
                isVisible={isQuestionModalVisible}
                selectedQuestionID={selectedQuestionID}
                researchInterestsOptions={userProfileQuestionData?.research_interests_types}
                allQuestionData={userProfileQuestionData?.questions}
                sectionData={userProfileQuestionData?.sections}
            />
        </div>
    );
}
