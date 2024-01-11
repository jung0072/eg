import React, {memo, useCallback, useEffect, useState} from "react";

import {Checkbox, DatePicker, Dropdown, Input, InputNumber, Select, Space, Table, Typography} from "antd";
import {CheckCircleOutlined} from "@ant-design/icons";

import {useGetSystemSettingsQuery, useUpdateSystemSettingsMutation} from "../../../redux/services/adminAPI";
import {getDays, months, weekdays} from "../../utils/common";
import {EngageSpinner, openNotification, renderFormErrors} from "../../utils";
import ModalPopup from "../../utils/ModalPopup";
import {BackgroundTaskDurations, BackgroundTasksName} from "../../utils/constants";

// Custom Field components for different data types
const DateTimeField = (data) => {
    return (
        <DatePicker/>
    )
}

const BooleanField = (data) => {

    const [checked, setChecked] = useState(data.value.bool_value);

    const handleCheckbox = useCallback((e) => {
        const updatedValue = e.target.checked;
        if (data.value.name === BackgroundTasksName.PERIODIC_EMAILS_ENABLED) {
            data.setIsBackgroundTaskDisabled(!updatedValue)
        }
        setChecked(updatedValue);
        data.updateMutation({name: data.value.name, value: e.target.checked})
    }, [checked])

    return (
        <Checkbox checked={checked} onChange={handleCheckbox} disabled={data.isUpdatingSettings}/>
    )
}

const SelectField = (data) => {
    const [selectedValue, setSelectedValue] = useState(data.value.selected_value);
    const [backgroundTaskData, setBackgroundTaskData] = useState({
        visibility: false,
        data: data,
        selectedValue: selectedValue,
        selectedPeriodicValue: '1'
    })

    const handleOnChangeSelect = useCallback((e) => {
        //Check if the option selected is not NONE or DAILY. In that case, just update the options.
        if (data.value.name === BackgroundTasksName.BACKGROUND_TASK_UNREAD_NOTIFICATIONS && e !== BackgroundTaskDurations.DAILY && e !== BackgroundTaskDurations.NEVER) {
            setSelectedValue(e)
            setBackgroundTaskData((prevState) => ({...prevState, visibility: true, selectedValue: e}))
        } else {
            setSelectedValue(e)
            data.updateMutation({name: data.value.name, value: e})
        }
    }, [selectedValue])

    async function handleBackgroundDataChanges() {
        await data.updateMutation({name: BackgroundTasksName.PERIODIC_EMAILS_STARTS, value: backgroundTaskData.selectedPeriodicValue})
        await data.updateMutation({name: data.value.name, value: backgroundTaskData.selectedValue})
        setBackgroundTaskData({
            visibility: false,
            data: data,
            selectedValue: selectedValue,
            selectedPeriodicValue: '1'
        });
    }

    return (<>
            <Select defaultValue={data.value.selected_value} onSelect={handleOnChangeSelect}
                    options={data.value.select_options} style={{width: 120}} disabled={data.isBackgroundTaskDisabled}/>
            {
                backgroundTaskData.visibility ? (
                        <ModalPopup
                            title="Edit background email recurrence"
                            type="info"
                            footerButton="Submit"
                            centered={true}
                            width={650}
                            loadingState={data.isUpdatingSettings}
                            visible={backgroundTaskData.visibility}
                            handleOk={handleBackgroundDataChanges}
                            handleCancel={() => {
                                setBackgroundTaskData({
                                    visibility: false,
                                    data: data,
                                    selectedValue: data.value.selected_value,
                                    selectedPeriodicValue: '1'
                                });
                                setSelectedValue(data.value.selected_value)
                            }}
                            disableScreenTouch={true}>
                            {/*Checking if the selected value is weekly or biweekly*/}
                            {(selectedValue === BackgroundTaskDurations.WEEKLY || selectedValue === BackgroundTaskDurations.BIWEEKLY) ?
                                <>
                                    Select a day of the week to schedule the email: <Select defaultValue={'1'}
                                                                                            onChange={(value) => {
                                                                                                setBackgroundTaskData((previous) => ({
                                                                                                    ...previous,
                                                                                                    selectedPeriodicValue: value
                                                                                                }));
                                                                                            }}
                                                                                            options={weekdays}
                                                                                            style={{width: 120}}/>
                                </>
                                : null
                            }
                            {/*Checking if the value is Monthly*/}
                            {(selectedValue === BackgroundTaskDurations.MONTHLY) ?
                                <>
                                    Select the day of the month you would like to schedule the emails: <Select
                                    defaultValue={'1'} onChange={(value) => {
                                    setBackgroundTaskData((previous) => ({...previous, selectedPeriodicValue: value}));
                                }}
                                    options={getDays('2')} style={{width: 120}}/>
                                </> : null

                            }
                            {(selectedValue === BackgroundTaskDurations.YEARLY) ?
                                <>
                                    Select the Month and Day of the year You would like to schedule the meeting: <br/>
                                    Month: <Select
                                    defaultValue={'1'} onChange={(value) => {
                                    setBackgroundTaskData((previous) => ({...previous, selectedPeriodicValue: value}));
                                }}
                                    options={months} style={{width: 120}}/> Day: <Select
                                    defaultValue={'1'} onChange={(value) => {
                                    setBackgroundTaskData((previous) => ({
                                        ...previous,
                                        selectedPeriodicValue: previous.selectedPeriodicValue + "," + value
                                    }));
                                }}
                                    options={getDays(backgroundTaskData.selectedPeriodicValue)} style={{width: 120}}
                                    disabled={backgroundTaskData.selectedPeriodicValue === null}/>
                                </> : null
                            }
                        </ModalPopup>
                    )
                    : null
            }
        </>
    )
}

const TextField = (data) => {
    return (
        <Input/>
    )
}

const IntegerField = (data) => {
    return (
        <InputNumber/>
    )
}

/**
 * Component for displaying and updating system settings.
 * @returns {JSX.Element} The SystemSettings component JSX element.
 */
function SystemSettings() {
    const [isBackgroundTaskDisabled, setIsBackgroundTaskDisabled] = useState()

    // get the system settings
    const {
        data: systemSettingsData,
        isLoading
    } = useGetSystemSettingsQuery();

    useEffect(() => {
        if (!isLoading) {
            const unreadNotificationData = systemSettingsData.find(item => item.name === BackgroundTasksName.BACKGROUND_TASK_UNREAD_NOTIFICATIONS);
            setIsBackgroundTaskDisabled(unreadNotificationData.enabled);
        }
    }, [isLoading]);

    // Mutation to update the system settings
    const [updateSystemSetting, {isLoading: isUpdatingSystemSetting}] = useUpdateSystemSettingsMutation()

    // Callback function to handle the update of a system setting
    const handleUpdateSystemSetting = useCallback((data) => {
        updateSystemSetting(data)
            .then((apiResponse) => {
                const {success, error} = apiResponse.data;
                if (error) {
                    renderFormErrors({data: {error}});
                } else if (success) {
                    // Show a notification to the admin when the system setting is successfully updated
                    openNotification({
                        placement: 'topRight',
                        message: `Successfully Updated the ${data.name}`,
                        description: `${success}`,
                        icon: <CheckCircleOutlined style={{color: 'green'}}/>
                    });
                }
            });
    })

    if (isLoading) {
        return <EngageSpinner loaderText={"Loading System Settings"}/>;
    }

    // create the settings object corresponding to the data type
    const settingsTypeComponents = [
        {
            data_type: "Boolean",
            component: (data) => <BooleanField value={data} isUpdatingSettings={isUpdatingSystemSetting}
                                               updateMutation={handleUpdateSystemSetting}
                                               setIsBackgroundTaskDisabled={setIsBackgroundTaskDisabled}/>
        },
        {
            data_type: "Integer",
            component: (data) => <IntegerField value={data} isUpdatingSettings={isUpdatingSystemSetting}
                                               updateMutation={handleUpdateSystemSetting}/>
        },
        {
            data_type: "Text",
            component: (data) => <TextField value={data} isUpdatingSettings={isUpdatingSystemSetting}
                                            updateMutation={handleUpdateSystemSetting}/>
        },
        {data_type: "Datetime", component: (data) => <DateTimeField value={data}/>},
        {
            data_type: "Select",
            component: (data) => <SelectField value={data} isUpdatingSettings={isUpdatingSystemSetting}
                                              updateMutation={handleUpdateSystemSetting}
                                              isBackgroundTaskDisabled={isBackgroundTaskDisabled}/>
        }
    ]

    const systemSettingsColumn = [
        {
            title: 'Setting Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                const matchingComponent = settingsTypeComponents.find(
                    (component) => component.data_type === record.data_type
                );
                return (
                    <Space size="middle">
                        {matchingComponent.component(record)}
                    </Space>
                )
            },
        },
    ];

    return (
        <div key={"system_settings"}>
            <Typography.Title level={3}>System Settings</Typography.Title>
            <Table pagination={false} dataSource={systemSettingsData} columns={systemSettingsColumn}/>
        </div>
    );
}

export default memo(SystemSettings);
