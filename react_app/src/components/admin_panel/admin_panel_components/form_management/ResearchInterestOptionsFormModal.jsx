import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Input, Space, Tree, Typography } from "antd";
import ModalPopup from "../../../utils/ModalPopup";
import {
    useGetResearchInterestOptionsQuery,
    useSubmitResearchInterestOptionsMutation
} from "../../../../redux/services/adminAPI";
import {
    DISPLAY_TYPES_ENUM,
    EngageSpinner,
    openNotification,
    renderFormErrors,
    renderMultiDimensionalList
} from "../../../utils";
import {
    CheckCircleOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditFilled,
    ExclamationOutlined,
    PlusOutlined,
    SaveOutlined,
    SearchOutlined
} from "@ant-design/icons";
import { countMultiDimensionalList } from "../../../utils/common";
import { updateOptionsWarning } from "../../../utils/constants.strings";


const { Text, Title } = Typography;

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

export default function ResearchInterestOptionsFormModal({ categoryID, isVisible, setIsVisible, categoryData }) {
    const [formRef] = Form.useForm();
    const [editingKey, setEditingKey] = useState(null);
    const [displayedOptions, setDisplayedOptions] = useState(null);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deletedOption, setDeletedOption] = useState(null);
    const [isAddingOption, setIsAddingOption] = useState(false);
    const [addedOption, setAddedOption] = useState('');
    const [optionsAddedCount, setOptionsAddedCount] = useState(0);
    const {
        data: researchInterestOptions,
        isLoading: isLoadingResearchInterestOptions,
        refetch: reFetchResearchInterestOptions
    } = useGetResearchInterestOptionsQuery(categoryID);
    const [
        submitOptionsMutation, { isLoading: isLoadingSubmitOptionsMutation }
    ] = useSubmitResearchInterestOptionsMutation();
    const currentCategory = categoryData.filter(category => category.id === categoryID)[0];

    // useEffect hook to set the new options once it is loaded
    useEffect(() => setDisplayedOptions(
        researchInterestOptions?.map(({ key, title, children, parent_interests_id }) => ({
            key,
            title,
            parent_interests_id,
            children: (children) ? children : []
        }))
    ), [researchInterestOptions]);

    // don't show anything unless the category is set
    if (!categoryID) {
        return null;
    }

    // show a loader when loading the category data
    if (isLoadingResearchInterestOptions) {
        return (<EngageSpinner loaderText={`Loading Options`} display={DISPLAY_TYPES_ENUM.AREA} />);
    }

    // callback function to submit the displayedOptionData to the backend in a POST Request and update the DB
    const handleClickSubmitOptionsBtn = () => {
        submitOptionsMutation({ categoryID: categoryID, options: displayedOptions }).then(
            ({ data, error }) => {
                if (error) {
                    renderFormErrors(
                        error,
                        null,
                        "There was an error submitting the options at this time, please try again later!"
                    );
                } else if (data) {
                    openNotification({
                        message: "Updated the Options",
                        description: data.success,
                        placement: 'topRight',
                        callback: null,
                        timeout: 200,
                        icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                    });
                    setDisplayedOptions(null);
                    setOptionsAddedCount(0);
                    reFetchResearchInterestOptions();
                    setIsVisible(false);
                }
            }
        ).catch(err => console.error("There was an error submitting the options at this time", err));
    };

    // callback function for handling editing the tree nodes
    const handleEditStart = (key) => {
        setEditingKey(key);
    };

    const handleInputChange = (event, key) => {
        // Update the edited node's title in the state
        const updatedData = researchInterestOptions.map((item) => {
            if (item.key === key) {
                return { ...item, title: event.target.value };
            }
            return item;
        });
        // Update the tree data in the state
        setDisplayedOptions(updatedData);
    };

    const handleEditFinish = (key) => {
        // Save the updated data to the server or perform any necessary actions
        // Clear the editing state
        setEditingKey(null);
    };

    // callback function to set the item to delete
    const handleDelete = (nodeData) => {
        setDeletedOption(nodeData);
        setIsDeleteModalVisible(true);
    };

    // callback function to send the request to delete this option (and all sub options) to the backend
    const handleDeleteFinish = () => {
        setDisplayedOptions((previous) => previous.filter(option => option !== deletedOption));
        setDeletedOption(null);
        setIsDeleteModalVisible(false);
    };

    // callback function when the admin cancels deleting an option
    const handleDeleteCancel = () => {
        setDeletedOption(null);
        setIsDeleteModalVisible(false);
    };

    // callback function to handle when the admin clicks to add an option
    const handleClickAddOptionBtn = () => setIsAddingOption(true);


    // callback function that will check if we have an option to add and then will add it to the displayed options
    // before closing the input and resetting the add option
    const handleClickSubmitAddOptionBtn = () => {
        setIsAddingOption(false);
        if (addedOption && addedOption !== '') {
            setDisplayedOptions((previous) => [{
                key: 0 - optionsAddedCount,
                title: addedOption,
                children: []
            }, ...previous]);
            setOptionsAddedCount((previousCount) => previousCount + 1);
        }
        setAddedOption('');
    };

    const handleClickCancelAddOptionBtn = () => {
        setIsAddingOption(false);
        setAddedOption('');
    };

    const renderTreeTitle = (nodeData) => {
        const isEditing = nodeData.key === editingKey;
        return (
            <div>
                {isEditing ? (
                    <Input
                        defaultValue={nodeData.title}
                        onChange={(e) => handleInputChange(e, nodeData.key)}
                        onBlur={() => handleEditFinish(nodeData.key)}
                        onPressEnter={() => handleEditFinish(nodeData.key)}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                    }}>
                        <span>{nodeData.title}</span>
                        <Space style={{ marginLeft: 'auto' }} align={"end"}>
                            <Button
                                size={"small"}
                                icon={<EditFilled />}
                                onClick={() => handleEditStart(nodeData.key)}
                            >
                                Edit
                            </Button>
                            <Button
                                size={"small"}
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(nodeData)}
                            >
                                Delete
                            </Button>
                        </Space>
                    </div>
                )}
            </div>
        );
    };

    // callback functions to handle the dragging of the options in the ree
    const onDragEnter = (info) => {
        console.log("Dragging option", info);
    };

    const handleTreeItemDrop = (dropInfo) => {
        // Extract the relevant information from the dropInfo
        const targetKey = dropInfo.node.key;
        const sourceKey = dropInfo.dragNode.key;
        const dropPositionPath = dropInfo.node.pos.split('-');
        const dropPosition = dropInfo.dropPosition - Number(dropPositionPath[dropPositionPath.length - 1]);

        // Recursive function to find a specific node by its key
        const findNodeByKey = (treeData, key, callback) => {
            for (let i = 0; i < treeData.length; i++) {
                if (treeData[i].key === key) {
                    return callback(treeData[i], i, treeData);
                }
                if (treeData[i].children) {
                    findNodeByKey(treeData[i].children, key, callback);
                }
            }
        };

        // Create a copy of the displayedOptions to work with
        const updatedDisplayedOptions = [...displayedOptions];
        // Find the dragged object
        let draggedItem;
        findNodeByKey(updatedDisplayedOptions, sourceKey, (item, index, array) => {
            array.splice(index, 1);
            draggedItem = item;
        });

        if (!dropInfo.dropToGap) {
            // Handle the case when the item is dropped onto the content of another node
            findNodeByKey(updatedDisplayedOptions, targetKey, (item) => {
                // Insert the node at the beginning of its children list
                item.children = (item.children) ? [...item.children] : [];
                item.children.unshift({ ...draggedItem, parent_interests_id: item.key });
            });
        } else if (
            (dropInfo.node.props.children || []).length > 0 && // has children
            dropInfo.node.props.expanded && // the children are expanded
            dropPosition === 1 // On the bottom gap
        ) {
            // Handle the case when the item is dropped onto a gap below a node
            findNodeByKey(updatedDisplayedOptions, targetKey, (item) => {
                // Insert the item at the beginning.
                item.children = item.children || [];
                item.children.unshift({ ...draggedItem, parent_interests_id: item.key });
            });
        } else {
            // Handle other cases where the item is dropped in between nodes
            let arrayToInsertInto = [];
            let insertionIndex;

            findNodeByKey(updatedDisplayedOptions, targetKey, (_item, index, array) => {
                arrayToInsertInto = array;
                insertionIndex = index;
            });
            if (dropPosition === -1) {
                arrayToInsertInto.splice(insertionIndex, 0, draggedItem);
            } else {
                arrayToInsertInto.splice(insertionIndex + 1, 0, draggedItem);
            }
        }

        // Update the displayedOptions state with the modified data
        setDisplayedOptions(updatedDisplayedOptions);
    };


    // callback function to close the modal
    const handleCloseModal = () => setIsVisible(false);

    return (
        <ModalPopup
            title={(
                <>
                    <Text>
                        Edit Options for the Category: {currentCategory?.title || categoryID}
                    </Text>
                    <Alert
                        message={"Reminder"}
                        description={updateOptionsWarning}
                        type="warning"
                        closable={false}
                        style={{ marginTop: '1em' }}
                    />
                </>
            )}
            visible={isVisible}
            handleOk={handleClickSubmitOptionsBtn}
            footerButton={"Save"}
            disableScreenTouch={true}
            handleCancel={handleCloseModal}
            type="info"
            footerButtonIcon={<SaveOutlined />}
            loadingState={isLoadingSubmitOptionsMutation}
            customFooter={(
                <Button
                    icon={<PlusOutlined />}
                    style={formModalStyles.button}
                    onClick={handleClickAddOptionBtn}
                >
                    Add Option
                </Button>
            )}
            width={800}
        >
            <Title level={5}>Drag and Drop the options to change parent and child options</Title>
            <div style={{ overflowY: 'scroll', height: 400, border: '2px solid black', padding: '1em' }}>
                <Form form={formRef}>
                    <Tree
                        className="draggable-options-tree"
                        draggable
                        blockNode
                        onDragEnter={onDragEnter}
                        onDrop={handleTreeItemDrop}
                        treeData={displayedOptions}
                        titleRender={renderTreeTitle}
                        showIcon={true}
                        showLine={true}
                    />
                </Form>
            </div>
            {
                (isAddingOption)
                    ? (
                        <Form.Item
                            label={<Text strong={true}>Add New Option</Text>}
                            labelCol={{ span: 24 }}
                            wrapperCol={{ span: 24 }}
                            name={'new_option'}
                            rules={[{ required: true }]}
                            style={{ marginTop: '1em' }}
                        >
                            <Space.Compact>
                                <Input
                                    style={{ width: '500px' }}
                                    value={addedOption}
                                    onChange={({ target }) => setAddedOption(target.value)}
                                />
                                <Button
                                    type="info"
                                    icon={<CloseOutlined />}
                                    onClick={handleClickCancelAddOptionBtn}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="info"
                                    icon={<PlusOutlined />}
                                    onClick={handleClickSubmitAddOptionBtn}
                                >
                                    Add
                                </Button>
                            </Space.Compact>
                        </Form.Item>
                    )
                    : null
            }
            <ModalPopup
                title={`Delete Option: ${deletedOption?.title}`}
                visible={isDeleteModalVisible}
                footerButton={"Delete"}
                handleOk={handleDeleteFinish}
                handleCancel={handleDeleteCancel}
                type={"info"}
                width={800}
                disableScreenTouch={true}
                footerButtonIcon={<DeleteOutlined />}
            >
                <Title level={5}>Are you sure you want to delete this option?</Title>
                {
                    (deletedOption?.children.length > 0)
                        ? (
                            <>
                                <Text>
                                    The following {countMultiDimensionalList(deletedOption.children)} options will be
                                    deleted along with these options
                                </Text>
                                <div
                                    style={{
                                        maxHeight: '300px',
                                        overflowY: "auto",
                                        marginTop: '1em',
                                        border: '2px solid black',
                                        padding: '1em'
                                    }}
                                >
                                    {renderMultiDimensionalList(deletedOption.children)}
                                </div>
                            </>
                        )
                        : null
                }
            </ModalPopup>
        </ModalPopup>
    );
}
