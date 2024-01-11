import React from 'react';
import { Input, InputNumber, Form } from "antd";

// based on the ant-d design documentation from: https://4x.ant.design/components/table/#components-table-demo-edit-row
export default function EditableTableCell(
    {
        editing,
        dataIndex,
        title,
        inputType,
        record,
        index,
        children,
        ...restProps
    }
) {
    // Get the initial value from the record if it exists
    const initialValue = (record) ? { defaultValue: record[dataIndex] } : {};
    const inputNode = inputType === 'number'
        ? <InputNumber {...initialValue} />
        : <Input {...initialValue} />;

    // Return the rendered JSX
    return (
        <td {...restProps}>
            {editing
                ? (
                    <Form.Item
                        name={`${dataIndex}_${record.id}`}
                        style={{
                            margin: 0,
                        }}
                        rules={[
                            {
                                required: true,
                                message: `Please Input ${title}!`,
                            },
                        ]}
                    >
                        {inputNode}
                    </Form.Item>
                )
                : (
                    children
                )}
        </td>
    );
};
