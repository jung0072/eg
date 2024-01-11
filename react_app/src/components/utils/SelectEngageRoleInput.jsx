import React, { useEffect, useState } from "react";
import { Form, Select } from "antd";
import { TASK_ROLES } from "./constants";


export default function SelectEngageRoleInput(
    {
        handleOnChange,
        inputLabel = "What is your role for Engage?",
        roleValue,
        disabled,
        inputStyle,
        formName = "role",
        inputRules = [{ required: true }],
        labelCol = { span: 24 },
        wrapperCol = { span: 24 },
        isInsightScopeAuth = false,
    }
) {

    const [taskRoles, setTaskRoles] = useState(TASK_ROLES);

    useEffect(() => {
        if (isInsightScopeAuth) {
            const filteredRoles = taskRoles.filter(role =>
                role.value !== 'PATIENT' &&
                role.value !== 'FAMILY_OF_PATIENT' &&
                role.value !== 'CARETAKER'
            );
            setTaskRoles(filteredRoles);
        }
    }, [isInsightScopeAuth]);

    return (
        <Form.Item label={inputLabel} labelCol={labelCol}
            wrapperCol={wrapperCol} rules={inputRules} name={formName}
        >
            <Select
                name="role"
                onChange={handleOnChange}
                value={roleValue}
                style={inputStyle}
                disabled={disabled}
            >
                {taskRoles.map((role) => (
                    <Option key={`role-${role.value}`} value={role.value}>{role.label}</Option>
                ))}
            </Select>
        </Form.Item>
    );
}
