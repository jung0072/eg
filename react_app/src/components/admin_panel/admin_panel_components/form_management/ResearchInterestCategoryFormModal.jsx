import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Typography } from "antd";
import ModalPopup from "../../../utils/ModalPopup";
import {
    useCreateResearchInterestCategoryMutation,
    useDeleteResearchInterestCategoryMutation,
    useLazyGetResearchInterestOptionsQuery,
    useUpdateResearchInterestCategoryMutation
} from "../../../../redux/services/adminAPI";
import { EngageSpinner, openNotification, renderFormErrors, renderMultiDimensionalList } from "../../../utils";
import { CheckCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { countMultiDimensionalList } from "../../../utils/common";

const { Text, Title } = Typography;

export default function ResearchInterestCategoryFormModal(
    {
        categoryID,
        isVisible,
        setIsVisible,
        categoryData,
        setDisplayedResearchCategories,
        isAdding = false
    }
) {
    const [formRef] = Form.useForm();
    const [currentCategory, setCurrentCategory] = useState(null);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [submitCreateCategoryRequest, { isLoading: isLoadingCreateCategoryRequest }] = useCreateResearchInterestCategoryMutation();
    const [submitUpdateCategoryRequest, { isLoading: isLoadingUpdateCategoryRequest }] = useUpdateResearchInterestCategoryMutation();
    const [submitDeleteCategoryRequest, { isLoading: isLoadingDeleteCategoryRequest }] = useDeleteResearchInterestCategoryMutation();
    const [triggerFetchResearchInterests, {
        data: researchInterestData,
        isLoading: isLoadingResearchInterestData
    }] = useLazyGetResearchInterestOptionsQuery();

    // useEffect to set the current category based on which category was clicked
    useEffect(() => {
        setCurrentCategory(
            (isAdding)
                ? null
                : categoryData.filter(category => category.id === categoryID)[0]
        );
    }, [categoryID, isVisible]);

    // useEffect hook to clear the form fields and then set in the new values based on the current category
    useEffect(() => {
        if (currentCategory) {
            formRef.setFieldValue('title', currentCategory.title);
            formRef.setFieldValue('description', currentCategory.description);
        } else {
            formRef.resetFields();
        }
    }, [currentCategory]);

    const handleSubmitResearchInterestCategoryForm = () => {
        // first build the request body sine its just title and description
        let requestBody = {
            title: formRef.getFieldValue('title'),
            description: formRef.getFieldValue('description'),
        };

        // now check if we are adding a new category or if we are editing a category
        let mutationCallback;
        if (isAdding) {
            mutationCallback = submitCreateCategoryRequest;
        } else {
            mutationCallback = submitUpdateCategoryRequest;
            requestBody = { ...requestBody, categoryID: categoryID };
        }

        // submit the request and show a toast notification based on the backend response
        mutationCallback(requestBody).then(({ data, error }) => {
            if (data) {
                // if successful show the toast notification to the admins and reset the form
                openNotification({
                    message: `${(isAdding) ? 'Created' : 'Updated'} Research Interest Category`,
                    description: `We have created the new category ${data.title}`,
                    placement: 'topRight',
                    callback: null,
                    timeout: 200,
                    icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                });
                setDisplayedResearchCategories((previous) => {
                    if (isAdding) {
                        // if we are just adding an item we can add it to the array of categories
                        return [...previous, data];
                    } else {
                        // using the id of the category find the index of it in the old types and update accordingly
                        const updatedIndex = previous.findIndex(category => category.id === data.id);
                        if (updatedIndex > -1) {
                            const oldCategory = previous[updatedIndex];
                            const updatedCategoryList = [...previous]
                            updatedCategoryList.splice(updatedIndex, 1, {
                                ...oldCategory,
                                ...data,
                            });
                            return updatedCategoryList;
                        }
                    }
                });
                formRef.resetFields();
                setIsVisible(false);
                setCurrentCategory(null);
            } else if (error) {
                renderFormErrors(error, null, 'Error saving the research interest category');
            }
        });
    };

    // callback function to handle when the admin deletes a research interest category
    const handleSubmitDeleteResearchInterestCategory = () => {
        submitDeleteCategoryRequest({ categoryID }).then(({ error, data }) => {
            if (data?.success) {
                // if successful show the toast notification to the admins and reset the form
                openNotification({
                    message: `Deleted the Research Interest Category`,
                    description: data.success,
                    placement: 'topRight',
                    callback: null,
                    timeout: 200,
                    icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                });
                formRef.resetFields();
                setIsVisible(false);
                setCurrentCategory(null);
            } else if (error) {
                renderFormErrors(error, null, 'Error saving the research interest category');
            }
        });
    };

    // close the modal and reset all the form fields
    const handleCloseModal = () => {
        setIsVisible(false);
        setCurrentCategory(null);
        formRef.resetFields();
    };


    // callback function to set the form fields values for each of the inputs
    const handleInputOnChange = (event) => formRef.setFieldValue(event.target.name, event.target.value);

    // callback function to show the delete modal
    const handleDeleteButtonClick = (event) => {
        setIsDeleteModalVisible(true);
        triggerFetchResearchInterests(categoryID);
    };
    const handleCancelDeleteButtonClick = (event) => setIsDeleteModalVisible(false);

    // don't show anything unless the category is set
    if (!categoryID && !isAdding) {
        return null;
    }

    return (
        <ModalPopup
            title={`Edit Category: ${currentCategory?.title || categoryID}`}
            visible={isVisible}
            handleOk={handleSubmitResearchInterestCategoryForm}
            handleCancel={handleCloseModal}
            type="info"
            width={800}
            disableScreenTouch={true}
            footerButton={'Submit'}
            loadingState={isLoadingCreateCategoryRequest || isLoadingUpdateCategoryRequest}
            customFooter={
                (isAdding)
                    ? null
                    : (
                        <Button
                            style={formModalStyles.button}
                            onClick={handleDeleteButtonClick}
                            icon={<DeleteOutlined />}
                        >
                            Delete
                        </Button>
                    )
            }
        >
            <Form form={formRef}>
                <Form.Item
                    label="Title"
                    name="title"
                    rules={[{ required: true, message: 'Please enter the title' }]}
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                >
                    <Input
                        onChange={handleInputOnChange}
                    />
                </Form.Item>

                <Form.Item
                    label="Description"
                    name="description"
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                >
                    <Input.TextArea
                        onChange={handleInputOnChange}
                    />
                </Form.Item>
            </Form>
            <ModalPopup
                title={`Delete Category: ${currentCategory?.title}`}
                visible={isDeleteModalVisible}
                footerButton={"Delete"}
                handleOk={handleSubmitDeleteResearchInterestCategory}
                handleCancel={handleCancelDeleteButtonClick}
                type={"info"}
                width={800}
                disableScreenTouch={true}
                footerButtonIcon={<DeleteOutlined />}
                loadingState={isLoadingDeleteCategoryRequest}
            >
                <Title level={5}>
                    Are you sure you want to delete this research interest category?
                </Title>
                <div style={{
                    display: 'flex',
                    flexFlow: 'column nowrap',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    marginTop: '1em'
                }}>
                    <Text strong={true}>Title:</Text>
                    <Text style={{ marginLeft: '1em' }}>{currentCategory?.title}</Text>
                    <Text strong={true}>Description:</Text>
                    <Text style={{ marginLeft: '1em' }}>{currentCategory?.description}</Text>

                    <div style={{ marginTop: '1em', width: '100%' }}>
                        <Text strong={true}>
                            The following {countMultiDimensionalList(researchInterestData)} options will be deleted
                            along with these options
                        </Text>
                        {
                            (isLoadingResearchInterestData)
                                ? <EngageSpinner
                                    loaderText={"Loading options for this category"}
                                    loaderType={"AREA"}
                                    useBackground={false}
                                />
                                : <div
                                    style={{
                                        maxHeight: '300px',
                                        overflowY: "auto",
                                        marginTop: '1em',
                                        border: '2px solid black',
                                        padding: '1em',
                                        width: '100%'
                                    }}
                                >
                                    {renderMultiDimensionalList(researchInterestData)}
                                </div>
                        }
                    </div>
                </div>
            </ModalPopup>
        </ModalPopup>
    );
}

const formModalStyles = {
    button: {
        boxShadow: '0px 4px 4px 0px #00000040',
        minWidth: '180px',
        height: '48px',
        borderRadius: '75px',
        backgroundColor: '#002E6D',
        color: '#FFFFFF',
        fontWeight: '500',
        fontSize: '16px'
    },
};
