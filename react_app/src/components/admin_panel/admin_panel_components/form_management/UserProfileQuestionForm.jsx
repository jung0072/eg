import React, { useCallback, useEffect, useState } from 'react';
import { Button, Checkbox, Form, Input, Popconfirm, Row, Select, Space, Table, Typography } from 'antd';
import {
    useDeleteUserProfileQuestionAdminMutation,
    useLazyUserProfileQuestionDetailsQuery,
    usePostUserProfileQuestionAdminMutation,
    useUpdateUserProfileQuestionAdminMutation
} from "../../../../redux/services/adminAPI";
import { openNotification, renderFormErrors, StrictModeDroppable } from "../../../utils";
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import EditableTableCell from "../../../utils/EditableTableCell";
import { CheckCircleOutlined, ExclamationCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { DeleteUserProfileQuestionPopup } from "./DeleteUserProfileQuestionPopup";
import { questionTypes } from "../../../utils/constants";

const { TextArea } = Input;


/**
 * Retrieves the question label based on  the field that is first set
 * @param {string} textForFamilyOfPatient - the text label for users that have the role Family of Patient
 * @param {string} textForCaretakerOfPatient - the text label for users that have the role Caretaker of Patient
 * @param {string} textForPatient - the text label for users that have the role Patient Partner
 * @param {string} textForResearcher - the text label for users that have the role Researcher
 * @param {string} textForPassive - the text label for users that have the role Passive User (not implemented anymore)
 * @returns {string} - The question label.
 */
function getFirstSetQuestionLabel(
    {
        text_for_family_of_patient: textForFamilyOfPatient,
        text_for_caretaker_of_patient: textForCaretakerOfPatient,
        text_for_patient: textForPatient,
        text_for_researcher: textForResearcher,
        text_for_passive: textForPassive
    }
) {
    if (textForResearcher) {
        return textForResearcher;
    } else if (textForPatient) {
        return textForPatient;
    } else if (textForCaretakerOfPatient) {
        return textForCaretakerOfPatient;
    } else if (textForFamilyOfPatient) {
        return textForFamilyOfPatient;
    } else if (textForPassive) {
        return textForPassive;
    }
    return '';
}

const VALID_PARENT_QUESTION_TYPES = [
    'RADIO_BUTTON_BOX',
    'RADIO_BUTTON_CIRCLE',
    'DROP_DOWN',
    'SELECT_MULTIPLE',
    'SELECT_MULTIPLE_BOX',
];

export default function UserProfileQuestionForm(
    {
        selectedQuestionID,
        researchInterestsOptions,
        allQuestionData,
        sectionData,
        handleCloseModal
    }
) {
    const [optionsList, setOptionsList] = useState([]);
    const [editingKey, setEditingKey] = useState('');
    const [isUsingResearchInterest, setIsUsingResearchInterests] = useState(false);
    const [isSubQuestion, setIsSubQuestion] = useState(false);
    const [parentQuestionOptions, setParentQuestionOptions] = useState([]);
    const [parentQuestionInputOptions, setParentQuestionInputOptions] = useState([]);
    const [selectedParentQuestion, setSelectedParentQuestion] = useState(null);
    const [selectedParentQuestionOption, setSelectedParentQuestionOption] = useState(null);
    const [profileSection, setProfileSection] = useState(null);
    const [checkedRoleValues, setCheckedRoleValues] = useState([]);
    const [deleteRequest, setDeleteRequest] = useState({ visible: false, record: null });
    const isEditing = (record) => record.key === editingKey;
    const [formRef] = Form.useForm();
    const [
        triggerGetQuestionDetails, { data: userProfileQuestionDetails, loading: isLoadingUserProfileQuestionDetails }
    ] = useLazyUserProfileQuestionDetailsQuery();

    // mutation function to post update or delete
    const [postUserProfileQuestion] = usePostUserProfileQuestionAdminMutation();
    const [updateUserProfileQuestion] = useUpdateUserProfileQuestionAdminMutation();
    const [deleteUserProfileQuestion] = useDeleteUserProfileQuestionAdminMutation();
    const onFinish = (values) => {
        // Update the current user profile question [PATCH] or create the question [POST] if we do not have a question id
        const mutationCallback = (selectedQuestionID) ? updateUserProfileQuestion : postUserProfileQuestion;
        mutationCallback({
            questionID: selectedQuestionID,
            questionBody: {
                ...values,
                parent_question_id: selectedParentQuestion?.id,
                parent_question_option_id: selectedParentQuestionOption,
                section: profileSection,
                options_list: optionsList.map((opt, index) => ({ ...opt, order_number: index + 1 }))
            }
        }).then(({ error, data }) => {
            if (error) {
                renderFormErrors(
                    error,
                    null,
                    `Error ${(selectedQuestionID) ? "Updating" : "Creating"} User Profile Question`
                );
            } else {
                const successLabel = (selectedQuestionID) ? "Updated" : "Created";
                openNotification({
                    message: `"${successLabel} User Profile Question"`,
                    description: `You have successfully ${successLabel.toLowerCase()} the user profile question. All affected profiles will be updated now.`,
                    placement: 'topRight',
                    callback: () => handleCloseModal(),
                    timeout: 400,
                    icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                });
            }
        }).catch(err => console.error("There was an error creating/updating this user profile question", err));
    };

    const handleRequestToDeleteUserProfileQuestion = useCallback(() => {
        const questionToDeleteIndex = allQuestionData.findIndex(question => question.id === selectedQuestionID);
        if (questionToDeleteIndex > -1) {
            setDeleteRequest({ visible: true, record: allQuestionData[questionToDeleteIndex] });
        } else {
            openNotification({
                message: `"Could Not Delete User Profile Question"`,
                description: `There was an issue trying to delete this profile question, please try again later`,
                placement: 'topRight',
                callback: () => handleCloseModal(),
                timeout: 400,
                icon: (<ExclamationCircleOutlined style={{ color: 'red' }} />),
            });
        }
    }, [selectedQuestionID, setDeleteRequest, allQuestionData]);

    const handleDeleteUserProfileQuestion = useCallback(() => {
        deleteUserProfileQuestion({
            questionID: selectedQuestionID
        }).then(({ data, error }) => {
            if (error) {
                renderFormErrors(error, null, `Error Deleting User Profile Question`);
            } else {
                openNotification({
                    message: `"Deleted User Profile Question"`,
                    description: `You have successfully deleted the user profile question. All affected profiles will be updated now.`,
                    placement: 'topRight',
                    callback: () => handleCloseModal(),
                    timeout: 400,
                    icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                });
            }
        }).catch(err => console.error("There was an error deleting the user profile question", err));
    }, [deleteUserProfileQuestion, selectedQuestionID]);

    // functions to handle editing the options table cells
    const handleEditOption = useCallback((record) => {
        formRef.setFieldsValue({
            title: '',
            mapping: '',
            ...record,
        });
        setEditingKey(record.key);
    }, [formRef, setEditingKey, selectedQuestionID]);

    const handleDeleteOption = useCallback((record) => {
        setOptionsList(previous => previous.filter(item => item.id !== record.id));
    }, [formRef, setOptionsList, selectedQuestionID]);

    const handleCancelEditOption = useCallback(() => {
        setEditingKey('');
    }, [setEditingKey, selectedQuestionID]);

    const handleAddOption = useCallback(() => setOptionsList(previousList => {
        // Create a new option identifier based on the length of the previous list (which will give a unique id)
        // and then create the new option and set it to the optionsList to force the table to re-render
        const newOptionIdentifier = previousList.length + 1;
        const newOption = {
            title: 'New Option',
            mapping: 'New Option Mapping',
            order_number: newOptionIdentifier,
            id: newOptionIdentifier,
            key: newOptionIdentifier
        };
        return [...previousList, newOption];
    }), [setOptionsList, selectedQuestionID]);

    const handleSaveOption = async (key) => {
        try {
            const row = await formRef.validateFields();
            const updatedOptionData = {
                title: row[`title_${key}`],
                mapping: row[`mapping_${key}`]
            };
            const newData = [...optionsList];
            const index = newData.findIndex((item) => key === item.id);
            if (index > -1) {
                const item = newData[index];
                newData.splice(index, 1, {
                    ...item,
                    ...updatedOptionData,
                });
                setOptionsList(newData);
                setEditingKey('');
            } else {
                newData.push(updatedOptionData);
                setOptionsList(newData);
                setEditingKey('');
            }
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    };

    const optionsTableColumns = [
        {
            title: '',
            dataIndex: 'index',
            key: 'index',
            editable: false,
            render: (title, record, index) => (<>{index + 1}</>)
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            editable: true,
        },
        {
            title: 'Mapping',
            dataIndex: 'mapping',
            key: 'mapping',
            editable: true,
        },
        {
            title: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Operation
                    <Button
                        htmlType="button"
                        type="success"
                        onClick={handleAddOption}
                        style={{ borderRadius: '5px', marginLeft: '1em' }}
                        icon={<PlusCircleOutlined />}
                    >
                        Add
                    </Button>
                </div>
            ),
            dataIndex: 'operation',
            key: 'operation',
            render: (_, record) => {
                const editable = isEditing(record);
                return editable
                    ? (
                        <span>
                            <Typography.Link
                                onClick={() => handleSaveOption(record.key)}
                                style={{
                                    marginRight: 8,
                                }}
                            >
                              Save
                            </Typography.Link>
                            <Popconfirm title="Sure to cancel?" onConfirm={handleCancelEditOption}>
                              <a>Cancel</a>
                            </Popconfirm>
                      </span>
                    )
                    : (
                        <Space>
                            <Typography.Link disabled={isEditing(record)} onClick={() => handleEditOption(record)}>
                                Edit
                            </Typography.Link>
                            <Typography.Link disabled={isEditing(record)} onClick={() => handleDeleteOption(record)}>
                                Delete
                            </Typography.Link>
                        </Space>
                    );
            },
        }
    ];

    //callback function for dragging table rows in the options table
    const handleOptionsTableDragEnd = useCallback((result) => setOptionsList(previousOptionsList => {
        if (!result.destination) {
            return;
        }

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        // Reorder the optionsList based on the drag and drop action
        const reorderedList = Array.from(previousOptionsList);
        const [removed] = reorderedList.splice(sourceIndex, 1);
        reorderedList.splice(destinationIndex, 0, removed);
        return reorderedList;
    }), [setOptionsList, selectedQuestionID]);

    const DraggableRow = ({ index, record, ...restProps }) => (record)
        ? (
            <Draggable
                draggableId={record.key.toString()}
                index={index}
                key={record.key}
            >
                {(provided, snapshot) => (
                    <tr
                        ref={provided.innerRef}
                        {...restProps}
                        style={{
                            ...restProps.style,
                            backgroundColor: snapshot.isDragging ? '#f5f5f5' : 'inherit',
                        }}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                    >
                        {restProps.children}
                    </tr>
                )}
            </Draggable>
        )
        : null;


    // useEffect hook to re-render the form based on the selected question ID. This will either display an error pop
    // up or it will set all the form field values based on the returned response
    useEffect(() => {
        if (selectedQuestionID) {
            triggerGetQuestionDetails({ questionID: selectedQuestionID }).then(({ data, error }) => {
                if (error) {
                    renderFormErrors(
                        error,
                        null,
                        "Error retrieving the details for this question!"
                    );
                } else if (data) {
                    // Set all the form fields to the returned data
                    formRef.setFieldsValue({ ...data });

                    // If we have an options list we can map out all the options to table ready format
                    if (data?.option_list) {
                        setOptionsList(data.option_list.map((opt, index) => ({
                            ...opt, key: opt.id
                        })));
                    }

                    // Check if we are using research interests or options list
                    setIsUsingResearchInterests(data?.linked_to_research_interest);

                    // Check if there is a parent question id and set that to the input
                    if (data?.parent_question_id) {
                        formRef.setFieldValue('is_sub_question', true);
                        setIsSubQuestion(true);
                        const questionIndex = allQuestionData.findIndex(
                            question => question.id === data?.parent_question_id
                        );
                        if (questionIndex > -1) {
                            setSelectedParentQuestion(allQuestionData[questionIndex]);
                        }
                    }
                    // Check if there is an option and set that to the input
                    setSelectedParentQuestionOption(data?.parent_question_options?.value);

                    // Now set the default state for the checked role values
                    setCheckedRoleValues(() => {
                        const checkedRoleValueList = [];
                        if (data.is_required_researcher) {
                            checkedRoleValueList.push('is_required_researcher');
                        }
                        if (data.is_required_patient) {
                            checkedRoleValueList.push('is_required_patient');
                        }
                        if (data.is_required_family_of_patient) {
                            checkedRoleValueList.push('is_required_family_of_patient');
                        }
                        if (data.is_required_passive) {
                            checkedRoleValueList.push('is_required_passive');
                        }
                        return checkedRoleValueList;
                    });
                    // check if there is a selected section and set that section
                    setProfileSection(data.section);
                }
            });
        } else {
            formRef.resetFields();
            setOptionsList([]);
            setEditingKey('');
            setIsUsingResearchInterests(false);
            setIsSubQuestion(false);
            setParentQuestionOptions([]);
            setParentQuestionInputOptions([]);
            setSelectedParentQuestion(null);
            setSelectedParentQuestionOption(null);
            setProfileSection(null);
            setCheckedRoleValues([]);
        }
    }, [
        selectedQuestionID, formRef, setOptionsList, triggerGetQuestionDetails, setCheckedRoleValues,
        setEditingKey, setIsUsingResearchInterests, setIsSubQuestion, setParentQuestionOptions,
        setParentQuestionInputOptions, setSelectedParentQuestion, setSelectedParentQuestionOption, setProfileSection
    ]);

    //  useEffect hook to render teh parent question options by filtering all questions not in this questions section
    useEffect(() => {
        if (isSubQuestion) {
            const questionSectionName = sectionData.filter(section => section.id === profileSection)[0]?.name;
            const questionsInSection = (selectedQuestionID)
                ? allQuestionData.filter(question => (
                    question.section_name === userProfileQuestionDetails.section_name &&
                    question.id !== userProfileQuestionDetails.id &&
                    VALID_PARENT_QUESTION_TYPES.includes(question.type)
                ))
                : (profileSection)
                    ? allQuestionData.filter(question => question.section_name === questionSectionName)
                    : allQuestionData;
            setParentQuestionOptions(questionsInSection.map(question => ({
                value: question.id,
                label: getFirstSetQuestionLabel(question)
            })));
        }
    }, [isSubQuestion, setParentQuestionOptions, profileSection, sectionData, selectedQuestionID]);

    // useEffect hook to load the parent questions options after requesting the details for the selected question
    useEffect(() => {
        if (selectedParentQuestion) {
            triggerGetQuestionDetails({ questionID: selectedParentQuestion.id }).then(({ data, error }) => {
                if (error) {
                    renderFormErrors(error, null, "Error submitting research project for approval!");
                } else if (data) {
                    setParentQuestionInputOptions(data.option_list.map((opt, index) => ({
                        ...opt, key: opt.id, label: opt.title, value: opt.id
                    })));
                }
            }).catch(console.error);
        }
    }, [selectedParentQuestion]);

    const handleSelectParentQuestion = useCallback((parentQuestionID) => {
        const questionIndex = allQuestionData.findIndex(question => question.id === parentQuestionID);
        if (questionIndex > -1) {
            setSelectedParentQuestion(allQuestionData[questionIndex]);
            setSelectedParentQuestionOption(null);
            formRef.setFieldValue('parent_question_options', null);
        }
    }, [allQuestionData, setSelectedParentQuestion, setSelectedParentQuestionOption, formRef]);

    const handleSelectParentQuestionOption = useCallback((parentQuestionOptionID) => setSelectedParentQuestionOption(parentQuestionOptionID), [allQuestionData, setSelectedParentQuestionOption]);


    const handleSelectSection = useCallback((sectionID) => setProfileSection(sectionID), [setProfileSection]);

    const handleSelectRole = useCallback((selectEvent) => {
        if (selectEvent.target.checked) {
            // if the checkbox is checked, add it to the array if it already isn't
            setCheckedRoleValues(previous => {
                if (!previous.includes(selectEvent.target.id)) {
                    return [...previous, selectEvent.target.id];
                }
                return previous;
            });
        } else {
            // if the checkbox is un-checked, remove the item from the array if its inside of it
            setCheckedRoleValues(previous => {
                if (previous.includes(selectEvent.target.id)) {
                    return previous.filter(item => item !== selectEvent.target.id);
                }
                return previous;
            });
        }
    }, [selectedQuestionID, setCheckedRoleValues]);
    const mergedOptionColumns = optionsTableColumns.map((col) => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record) => ({
                record,
                inputType: 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
                key: col.key
            }),
        };
    });

    return (
        <Form onFinish={onFinish} form={formRef} title={`Selected Question: ${selectedQuestionID}`}>
            <Form.Item
                label={"Select the User Profile Section"}
                name={'section'}
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                rules={[{
                    required: true,
                    message: 'You must select a user profile section for this new question'
                }]}
            >
                <Select
                    options={sectionData.map(({ id, name }) => ({ value: id, label: name }))}
                    onSelect={handleSelectSection}
                />
            </Form.Item>

            <Form.Item
                label="Is this question a sub question?"
                name="is_sub_question"
                valuePropName="checked"
            >
                <Checkbox onClick={(evt) => setIsSubQuestion(evt.target.checked)} />
            </Form.Item>

            {
                (isSubQuestion)
                    ? (
                        <>
                            <Form.Item
                                label="Select a Parent Question"
                                name="parent_question_id"
                                rules={[{ required: true, message: 'You must select a parent question' }]}
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <Select
                                    options={parentQuestionOptions}
                                    onSelect={handleSelectParentQuestion}
                                />
                            </Form.Item>
                            <Form.Item
                                label="Select the option that this question should appear under."
                                name="parent_question_options"
                                rules={[{ required: true, message: 'You must select an option from the parent question' }]}
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <Select
                                    options={parentQuestionInputOptions}
                                    onSelect={handleSelectParentQuestionOption}
                                />
                            </Form.Item>
                        </>
                    )
                    : null
            }

            <Form.Item
                label="Order Number"
                name="order_number"
                rules={[{ required: true, message: 'Please enter order number' }]}
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
            >
                <Input type="number" />
            </Form.Item>

            <Form.Item
                label="Linked to Research Interest"
                name="linked_to_research_interest"
                valuePropName="checked"
            >
                <Checkbox
                    onClick={(evt) => setIsUsingResearchInterests(evt.target.checked)}
                />
            </Form.Item>

            <Form.Item
                label="Type"
                name="type"
                rules={[{ required: true, message: 'Please select a type' }]}
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
            >
                <Select
                    options={
                        (isUsingResearchInterest)
                            ? questionTypes.filter(type => type.isAllowedResearchInterest)
                            : questionTypes
                    }
                />
            </Form.Item>

            <Form.Item
                label={"Which roles is this question required for?"}
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                name={"is_required_researcher"}
                valuePropName="checked"
            >
                <Checkbox onChange={handleSelectRole}>Researchers/ Clinicians</Checkbox>
            </Form.Item>

            <Form.Item name={"is_required_patient"} valuePropName="checked">
                <Checkbox onChange={handleSelectRole}>Patients</Checkbox>
            </Form.Item>
            <Form.Item name={"is_required_family_of_patient"} valuePropName="checked">
                <Checkbox onChange={handleSelectRole}>Family/ Caretakers of Patients</Checkbox>
            </Form.Item>
            <Form.Item name={"is_required_passive"} valuePropName="checked">
                <Checkbox onChange={handleSelectRole}>Passive</Checkbox>
            </Form.Item>

            <Form.Item
                label="Text for Researcher"
                name="text_for_researcher"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                hidden={!checkedRoleValues.includes('is_required_researcher')}
            >
                <TextArea maxLength={600} rows={1} />
            </Form.Item>

            <Form.Item
                label="Text for Patient"
                name="text_for_patient"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                hidden={!checkedRoleValues.includes('is_required_patient')}
            >
                <TextArea maxLength={600} rows={1} />
            </Form.Item>

            <Form.Item
                label="Text for Family of Patient"
                name="text_for_family_of_patient"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                hidden={!checkedRoleValues.includes('is_required_family_of_patient')}
            >
                <TextArea maxLength={600} rows={1} />
            </Form.Item>

            <Form.Item
                label="Text for Caretaker of Patient"
                name="text_for_caretaker_of_patient"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                hidden={!checkedRoleValues.includes('is_required_family_of_patient')}
            >
                <TextArea maxLength={600} rows={1} />
            </Form.Item>

            <Form.Item
                label="Text for Passive"
                name="text_for_passive"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                hidden={!checkedRoleValues.includes('is_required_passive')}
            >
                <TextArea maxLength={600} rows={1} />
            </Form.Item>

            <Form.Item
                label="Help Text"
                name="help_text"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
            >
                <TextArea rows={1} />
            </Form.Item>

            <Form.Item
                label="Is Mandatory"
                name="is_mandatory"
                valuePropName="checked"
            >
                <Checkbox />
            </Form.Item>

            <Form.Item
                label="Display Text"
                name="display_text"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
            >
                <TextArea rows={1} />
            </Form.Item>

            <Form.Item
                label="Is Displayed in Profile Variables"
                name="is_displayed_in_profile_variables"
                valuePropName="checked"
            >
                <Checkbox />
            </Form.Item>

            <Form.Item
                label="Is Searchable"
                name="is_searchable"
                valuePropName="checked"
            >
                <Checkbox />
            </Form.Item>

            <Form.Item
                label="Placeholder Text"
                name="placeholder_text"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
            >
                <TextArea rows={1} />
            </Form.Item>

            {
                (isUsingResearchInterest)
                    ? (
                        <Form.Item
                            label="Research Interest Area"
                            name="research_interest_area"
                            rules={[{ required: true, message: 'Please select a type' }]}
                            labelCol={{ span: 24 }}
                            wrapperCol={{ span: 24 }}
                        >
                            <Select options={researchInterestsOptions} />
                        </Form.Item>
                    )
                    : (
                        <Form.Item label="Options" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                            <DragDropContext onDragEnd={handleOptionsTableDragEnd}>
                                <StrictModeDroppable droppableId="tableRows">
                                    {(provided) => (
                                        <Table
                                            columns={mergedOptionColumns}
                                            dataSource={optionsList}
                                            pagination={false}
                                            rowClassName="editable-row"
                                            rowKey={record => record.key}
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            onRow={(record, index) => ({
                                                record,
                                                index,
                                                onClick: (clickEvent) => console.log(record, index, clickEvent),
                                                ref: provided.innerRef,
                                                ...provided.draggableProps,
                                                ...provided.dragHandleProps,
                                            })}
                                            components={{
                                                body: {
                                                    cell: EditableTableCell,
                                                    row: (props) => <DraggableRow {...props} record={props.record} />,
                                                }
                                            }}
                                        />
                                    )}
                                </StrictModeDroppable>
                            </DragDropContext>
                        </Form.Item>
                    )
            }
            <Row>
                <Button
                    style={{ marginLeft: 'auto', marginTop: '2em', borderRadius: '5px' }}
                    type="primary"
                    htmlType="submit"
                >
                    Submit
                </Button>
                {
                    (selectedQuestionID)
                        ? (
                            <Button style={{ marginLeft: '1em', marginTop: '2em', borderRadius: '5px' }}
                                type="danger"
                                onClick={handleRequestToDeleteUserProfileQuestion}
                            >
                                Delete
                            </Button>
                        )
                        : null
                }
            </Row>
            <DeleteUserProfileQuestionPopup
                handleDeleteUserProfileQuestion={handleDeleteUserProfileQuestion}
                isVisible={deleteRequest.visible}
                recordToDelete={deleteRequest.record}
                setDeleteRequest={setDeleteRequest}
            />
        </Form>
    );
};
