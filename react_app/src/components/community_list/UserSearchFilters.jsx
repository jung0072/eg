import React, { useCallback, useEffect, useState } from 'react';
import { Button, Collapse, DatePicker, Drawer, Form, Input, Select, Space } from "antd";
import { FilterFilled, DeleteOutlined } from "@ant-design/icons";
import { checkIsValidRangePickerMomentDate, formatRangePickerMomentDate } from "../utils/common";
import './style/user_search_filters.css';

const { Item } = Form;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

export default function UserSearchFilters({ filters, isOpen, setIsOpenState, setSelectedFilters, selectedFilters, isFilterDataLoaded }) {
    const [isFilterSelected, setIsFilterSelected] = useState(Object.keys(selectedFilters).length > 0);
    const [sections, setSections] = useState([]);
    const handleCloseFilterDrawer = useCallback(() => setIsOpenState(false), [filters]);
    const handleShowFilterDrawer = useCallback(() => setIsOpenState(true), [filters]);
    const [formData, setFormData] = useState({ ...selectedFilters });
    const [formHook] = Form.useForm();

    // useEffect hook to build all the sections from the returned user profile questions
    useEffect(() => {
        if (!filters) return;
        const uniqueSections = new Set();
        filters.forEach(({ section_name: sectionName }) => uniqueSections.add(sectionName));
        setSections(Array.from(uniqueSections));
    }, [filters, setSections]);

    // useEffect hook to check if a filter is selected or not
    useEffect(() => {
        setIsFilterSelected(Object.keys(formData).length > 0);
    }, [setIsFilterSelected, formData]);

    // useEffect hook to check if the user has selected any filters
    useEffect(() => {
        setIsFilterSelected(Object.keys(selectedFilters).length > 0);
    }, [selectedFilters]);

    const mapFiltersToInputs = useCallback(({ id, label, options, type }) => {
        let questionInput;
        const handleInputChange = (event) => {
            formHook.setFieldValue(id, event.target.value);
            setFormData(previous => ({ ...previous, [id]: event.target.value }));
        };

        const handleDateInputOnChange = (momentDate, dateString) => {
            formHook.setFieldValue(id, dateString);
            setFormData(previous => ({ ...previous, [id]: dateString }));
        };
        let modifiedValue;
        switch (type) {
            case "TEXT_BODY":
            case "TEXT_AREA":
                questionInput = (
                    <Input onChange={handleInputChange} style={userFilterStyles.input}
                           value={formData[id]} name={id}
                    />
                );
                break;
            case "DATE_PICKER":
                modifiedValue = formatRangePickerMomentDate(formData[id]);
                questionInput = (
                    <RangePicker onChange={handleDateInputOnChange}
                                 value={checkIsValidRangePickerMomentDate(modifiedValue) ? modifiedValue : ''}
                                 style={userFilterStyles.input}
                                 name={id}
                    />
                );
                break;
            case "DATE_PICKER_YEAR":
                modifiedValue = formatRangePickerMomentDate(formData[id], "YYYY");
                questionInput = (
                    <RangePicker picker={"year"} onChange={handleDateInputOnChange}
                                 value={checkIsValidRangePickerMomentDate(modifiedValue) ? modifiedValue : ''}
                                 style={userFilterStyles.input}
                                 name={id}

                    />
                );
                break;
            default:
                questionInput = (
                    <Select
                        showSearch={true}
                        options={options.map(opt => ({ value: opt.mapping || opt.title, label: opt.title }))}
                        mode={"multiple"}
                        style={userFilterStyles.input}
                        onChange={selections => {
                            formHook.setFieldValue(id, selections);
                            setFormData(previous => ({ ...previous, [id]: selections }));
                        }}
                        value={formData[id]}
                        name={id}
                    />
                );
        }
        const valuePropObj = (type === "DATE_PICKER" || type === "DATE_PICKER_YEAR") ? { valuePropName: "date" } : {};
        return (
            <Item name={id} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} label={label} key={id}
                  style={userFilterStyles.formItem}
                  {...valuePropObj}
            >
                {questionInput}
            </Item>
        );
    }, [filters, formData]);

    const mapSectionsToPanels = (section, index) => (
        <Panel header={section} key={index}>
            {filters.filter(({ section_name }) => section_name === section).map(mapFiltersToInputs)}
        </Panel>
    );

    const applySearchFilters = useCallback(() => {
        setIsOpenState(false);
        setSelectedFilters({ ...formData });
    }, [setSelectedFilters, setIsOpenState, formData]);

    const resetSearchFilters = useCallback(() => {
        setIsOpenState(false);
        setSelectedFilters({});
    }, [setIsOpenState, setSelectedFilters, formData]);

    return (
        <>
            <Drawer
                title={"Filters"}
                className={"user-filter-drawer"}
                placement="right"
                onClose={handleCloseFilterDrawer}
                closable={true}
                open={isOpen}
                extra={(
                    <Space>
                        <Button type={"primary"} icon={(<FilterFilled/>)} onClick={applySearchFilters}
                                style={{ borderRadius: '5px' }}
                        >
                            Apply
                        </Button>
                        <Button type={"ghost"} icon={(<DeleteOutlined/>)} onClick={resetSearchFilters}
                                style={{ borderRadius: '5px' }}
                        >
                            Reset
                        </Button>
                    </Space>
                )}
            >
                <Form form={formHook} initialValues={selectedFilters}>
                    <Collapse>
                        {sections.map(mapSectionsToPanels)}
                    </Collapse>
                </Form>
            </Drawer>
            <Button type={(isFilterSelected) ? "primary" : "secondary"}
                    icon={<FilterFilled/>} onClick={handleShowFilterDrawer}
                    style={{ borderRadius: '5px', marginBottom: '1em' }} loading={!isFilterDataLoaded}
            >
                Filters
            </Button>
        </>
    );
}

const userFilterStyles = {
    input: {
        borderRadius: '5px',
    },
    formItem: {
        marginBottom: '0.5em'
    }
};
