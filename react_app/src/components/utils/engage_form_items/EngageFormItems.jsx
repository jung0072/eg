import React, { useEffect, useState } from "react";
import { Checkbox, Col, DatePicker, Form, Radio, Row } from "antd";
import moment from "moment";

import { HelpTextPopover } from "render-chan";

import { Constants } from "../index";

const DatePickerType = ({
    dateType,
    itemDateType,
    initialDate,
    formItemChangeCallback,
}) => {
    // state for date picker
    const [initialValue, setInitialValue] = useState(initialDate);
    const selectedDateType = Constants.DATE_TYPES[itemDateType];

    // Function to update the year to current year, when setting day month the year is set to 0001
    // to resolve that we need to update the year to current year
    const updateYear = (momentDate) => {
        const currentYear = moment().year();
        if (momentDate?.year() === parseInt("0001")) {
            return momentDate?.year(currentYear);
        }
        return momentDate;
    };

    useEffect(() => {
        setInitialValue(updateYear(initialValue));
    }, [initialValue]);

    return (
        <Col key={dateType} span={12}>
            <Form.Item
                label={`${dateType} ${selectedDateType.label}`}
                name={`${dateType.toLowerCase()}_date`}
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                valuePropName="date"
                rules={[
                    {
                        required: true,
                        message:
                            'You must select a date, if you are uncertain about the date, please click \'Not yet decided\'',
                    },
                ]}
                initialValue={initialValue}
            >
                <DatePicker
                    key={dateType}
                    showTime={selectedDateType?.showTime}
                    showToday={true}
                    name={`${dateType.toLowerCase()}_date`}
                    picker={selectedDateType.picker}
                    format={selectedDateType.format}
                    onChange={(momentDate, dateString) => {
                        setInitialValue(updateYear(momentDate)); // Update the year
                        if (formItemChangeCallback) {
                            formItemChangeCallback();
                        }
                    }}
                    value={initialValue?.isValid() ? initialValue : ''}
                />
            </Form.Item>
        </Col>
    );
};


const EstimatedDates = ({
    compKey,
    dateType, // start or end
    initialItemDateType, // initial date type which will be set by the state
    initialDateDecided,
    dateOptions,
    handleDateTypeCallback,
    initialDate,
    formItemChangeCallback,
}) => {

    // state for if using start/end date or not
    const [estimatedDateDecided, setEstimatedDateDecided] = useState(initialDateDecided);
    // state: if we are using est date what is the type
    const [itemDateType, setItemDateType] = useState(initialItemDateType?.key);
    // state: if we have a type what is the value
    const [estInitialDate, setEstInitialDate] = useState(initialDate);

    const handleDateType = (e) => {
        setItemDateType(e.target.value);
        setEstInitialDate(undefined);
        // callback
        if (handleDateTypeCallback) {
            handleDateTypeCallback();
        }
    }

    return (
        <div key={compKey}>
            <Col span={24}>
                <Form.Item label={(
                    <HelpTextPopover questionText={`Estimated ${dateType} Date`}
                        helpText={"This can be edited later at any time"}
                    />
                )}
                    name={`is_using_${dateType.toLowerCase()}_date`} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                    initialValue={estimatedDateDecided}
                >
                    <Radio.Group value={estimatedDateDecided} size="large">
                        <Radio.Button onClick={() => setEstimatedDateDecided(false)} value={false}>
                            Not yet decided
                        </Radio.Button>
                        <Radio.Button onClick={() => setEstimatedDateDecided(true)} value={true}>
                            Estimated Dates
                        </Radio.Button>
                    </Radio.Group>
                </Form.Item>
            </Col >
            {
                estimatedDateDecided ?
                    <>
                        <Col span={24}>
                            <Form.Item name={`${dateType.toLowerCase()}_date_type`} label="Select date type:" labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{
                                    required: true,
                                    message: 'You must select a date type, if you are uncertain about the date, please click \'Not yet decided\''
                                }]}
                                initialValue={itemDateType}
                            >
                                <Radio.Group value={itemDateType} onChange={handleDateType} size="large">
                                    {/* map the available options */}
                                    {dateOptions.map((item, index) => {
                                        return (
                                            <Radio.Button key={index} value={item.key}>
                                                {item.label}
                                            </Radio.Button>
                                        )
                                    })}
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        {itemDateType &&
                            (
                                <DatePickerType
                                    initialDate={estInitialDate}
                                    dateType={dateType}
                                    itemDateType={itemDateType}
                                    formItemChangeCallback={formItemChangeCallback}
                                />
                            )}
                    </>
                    : ''}
        </div>
    );
};

const EngageRolePicker = ({
    questionLabel,
    initialSelectedRole,
    onRoleChangeCallback,
    onSelectAllCallback,
    required = true,
}) => {
    const formRef = Form.useFormInstance();
    // states for the roles needed
    const [checkedRoles, setCheckedRoles] = useState([]);
    const [indeterminate, setIndeterminate] = useState(false);
    const [selectAllRole, setSelectAllRole] = useState(false);

    useEffect(() => {
        setCheckedRoles(initialSelectedRole);
        if (initialSelectedRole?.length === Constants.TASK_ROLES.length) {
            setIndeterminate(!!initialSelectedRole.length && initialSelectedRole.length < Constants.TASK_ROLES.length);
            setSelectAllRole(initialSelectedRole.length === Constants.TASK_ROLES.length);
        }
    }, [initialSelectedRole])

    const onRoleChange = (list) => {
        // set selected item to the state
        setCheckedRoles(list);
        // set the indeterminate whether all are checked or just some
        setIndeterminate(!!list.length && list.length < Constants.TASK_ROLES.length);
        // set selected role for the all check
        setSelectAllRole(list.length === Constants.TASK_ROLES.length);
        formRef.setFieldValue('roles_needed', list)
        if (onRoleChangeCallback) {
            onRoleChangeCallback(list);
        }
    };

    // handles if select all is clicked or not
    const onSelectAllRoleChange = (e) => {
        setCheckedRoles(e.target.checked ? Constants.TASK_ROLES.map((roleValue) => roleValue.value) : []);
        setIndeterminate(false);
        setSelectAllRole(e.target.checked);
        if (e.target.checked) {
            formRef.setFieldValue('roles_needed', Constants.TASK_ROLES.map((roleValue) => roleValue.value));
        } else {
            formRef.setFieldValue('roles_needed', []);
        }
        if (onSelectAllCallback) {
            onSelectAllCallback();
        }
    };

    return (
        <Form.Item label={questionLabel} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
            name={"roles_needed"}
            rules={[{ required: required, message: 'You must select the roles you require' }]}
        >
            <Checkbox.Group
                rows={5}
                name="roles_needed"
                onChange={onRoleChange}
                value={checkedRoles}
                options={Constants.TASK_ROLES}
            />
            <Row>
                <Checkbox indeterminate={indeterminate} checked={selectAllRole}
                    onChange={onSelectAllRoleChange}>
                    Select all
                </Checkbox>
            </Row>
        </Form.Item>
    )
}

export { EstimatedDates, EngageRolePicker };
