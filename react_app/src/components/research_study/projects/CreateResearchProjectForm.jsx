import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Checkbox,
    Col,
    Divider,
    Form,
    Input,
    Layout,
    Modal,
    Radio,
    Row,
    Select,
    Space,
    TreeSelect,
    Typography,
} from "antd";

import { useResearchInterestsDataQuery } from '../../../redux/services/researchProjectAPI';
import { Constants, EngageSpinner, EstimatedDates, mapOptionsToTreeData } from "../../utils";
import { openNotification, renderFormErrors } from "../../utils/";
import { CheckCircleOutlined } from "@ant-design/icons";
import UserSearchBox from "../../user_picker/UserSearchBox";
import MultipleUserSearchBox from "../../user_picker/MultipleUserSearchBox";
import '../research_task/research_task_form.css';
import { HelpTextPopover } from "render-chan";
import { formatMomentDate } from "../../utils/common";
import ModalPopup from "../../utils/ModalPopup";
import { useDeleteProjectMutation } from "../../../redux/services/researchProjectAPI";
import { EngageRolePicker } from "../../utils/engage_form_items/EngageFormItems";

const { TextArea } = Input;

const INITIAL_RESEARCH_PROJECT = {
    title: '',
    description: '',
    reference_name: '',
    creator: '',
    alternate_lead: '',
    lead: '',
    start_date: null,
    end_date: null,
    type: '',
    study_format: '',
    centre_format: '',
    research_interests: [],
    roles_needed: [],
    main_contact: '',
    contact_email: '',
    is_contact_visible: false,
    institution_website: '',
    website_link: '',
    twitter_link: '',
    facebook_link: '',
    instagram_link: '',
    research_gate_link: '',
    partner_commitment_description: '',
    main_contact_profile: {},
    creator_name: '',
    has_social_media_links: false,
    recruiting_status: '',
    principal_investigators: [],
    is_complete: false,
    is_public: true
};

const { Title, Paragraph } = Typography;

export default function CreateResearchProjectForm(
    {
        mutationTrigger,
        isLoadingMutation,
        researchProjectData = { id: null }
    }
) {
    // TODO: Make a request universities, hospitals
    const [formRef] = Form.useForm();
    const [formData, setFormData] = useState({ ...INITIAL_RESEARCH_PROJECT, ...researchProjectData });
    const [formErrorData, setFormErrorData] = useState([]);
    const [hasSocialMediaLinks, setHasSocialMediaLinks] = useState(false);
    const [deleteProjectModal, setDeleteProjectModal] = useState(false);
    const navigate = useNavigate();
    const {
        data: researchInterestData,
        isLoading: isLoadingResearchInterests
    } = useResearchInterestsDataQuery();
    const [deleteProject] = useDeleteProjectMutation();
    const {
        end_date_type,
        end_date,
        has_social_media_links,
        is_using_end_date,
        is_using_start_date,
        start_date_type,
        start_date,
        roles_needed,
        is_public
    } = researchProjectData;

    // moment start and end date
    const momentStartDate = formatMomentDate(start_date);
    const momentEndDate = formatMomentDate(end_date);

    const handleChangeStudy = useCallback((e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }, []);

    // For custom option input for study type
    const studyTypeInputRef = useRef(null);
    const [studyTypeName, setStudyTypeName] = useState('');
    const [studyTypeOptions, setStudyTypeOptions] = useState([
        { value: "EDUCATION", label: "Education" },
        { value: "GUIDELINE_DEVELOPMENT", label: "Guideline Development" },
        { value: "PATIENT_SAFETY", label: "Patient Safety" },
        { value: "QUALITY_IMPROVEMENT", label: "Quality Improvement" },
        { value: "RESEARCH_STUDY", label: "Research Study" },
    ]);

    // For custom option input for study format
    const studyFormatInputRef = useRef(null);
    const [studyFormatName, setStudyFormatName] = useState('');
    const [studyFormatOptions, setStudyFormatOptions] = useState([
        { value: "PROSPECTIVE_OBSERVATIONAL", label: "Prospective Observational" },
        { value: "RCT", label: "RCT" },
        { value: "RETROSPECTIVE_OBSERVATIONAL", label: "Retrospective Observational" },
        { value: "SYSTEMATIC_REVIEW", label: "Scoping / Systematic Review" },
        { value: "SURVEY", label: "Survey" },
    ]);
    // hook to delete the project
    const handleDeleteProjectCallback = useCallback((projectId) => {
        deleteProject(projectId).then((apiResponse) => {
            const { success, error } = apiResponse.data;
            if (error) {
                renderFormErrors({ data: { error } });
            } else if (success) {
                // show the admin a notification saying the user was deleted and then close the modal
                openNotification({
                    placement: 'topRight',
                    message: `Successfully Deleted Project ${projectId}`,
                    description: `${success}`,
                    icon: <CheckCircleOutlined style={{ color: 'green' }} />
                });
                setDeleteProjectModal(false);
                navigate(-2, { replace: true });
            }
        });
    }, []);

    // useEffect hook to reload the initial
    const handleFormFinish = useCallback(async (values) => {

        if (values.is_using_start_date) {
            values.start_date = formatMomentDate(values.start_date).format("YYYY-MM-DD");
        }
        if (values.is_using_end_date) {
            values.end_date = formatMomentDate(values.end_date).format("YYYY-MM-DD");
        }

        mutationTrigger(
            {
                ...values,
                is_public: formData.is_public,
                id: researchProjectData.id,
            }
        ).then(({ data, error }) => {
            if (error) {
                renderFormErrors(
                    error, setFormErrorData,
                    (researchProjectData.id) ? "Could not Create Research Project" : "Error saving research project"
                );
            } else {
                // show the user a notification on save and then navigate them to the next page after a few seconds
                openNotification({
                    message: (researchProjectData.id) ? "Updated Research Project " : 'Created Research Project',
                    description: (researchProjectData.id)
                        ? `You have updated the research project ${data.title}`
                        : `You have successfully created the project: ${data.title}. We will automatically navigate you to the new project to set up Team Demographics in a few seconds.`,
                    placement: 'topRight',
                    icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                    timeout: 3000,
                    callback: (researchProjectData.id)
                        ? () => Modal.destroyAll()
                        : () => navigate(`/app/research_study_form/${data.id}/?showTeamDemographics=true`)
                });
            }
        }).catch(console.error);
    }, [mutationTrigger, formRef, researchProjectData, formData]);

    // useEffect block to set the initial formValues each time the researchProjectData coming into the form changes
    useEffect(() => {

        formRef.setFieldsValue({ ...researchProjectData, is_public: (is_public || is_public === undefined) ? 'PUBLIC' : 'PRIVATE' });

        setFormData(previous => ({
            ...previous,
            ...researchProjectData,
        }));
        setHasSocialMediaLinks(has_social_media_links);
    }, [formRef, researchProjectData]);

    // if we were given research project data, then we know that this form is meant for editing
    const formTitle = (researchProjectData.id)
        ? 'Edit Research Project'
        : 'Create a Research Project';

    if (isLoadingResearchInterests) {
        return (<EngageSpinner />);
    }

    const onCustomTypeInputChange = (event) => {
        setStudyTypeName(event.target.value);
    };

    const addOptionToStudyTypeSelect = (e) => {
        e.preventDefault();
        if (e.target.value === '') {
            return;
        }
        const newOption = { value: studyTypeName, label: studyTypeName };
        setStudyTypeOptions([...studyTypeOptions, newOption]);
        setStudyTypeName('');
        setTimeout(() => {
            studyTypeInputRef.current?.focus();
        }, 0);
    };

    const onCustomFormatInputChange = (event) => {
        setStudyFormatName(event.target.value);
    };

    const addOptionToStudyFormatSelect = (e) => {
        e.preventDefault();
        if (e.target.value === '') {
            return;
        }
        const newOption = { value: studyFormatName, label: studyFormatName };
        setStudyFormatOptions([...studyFormatOptions, newOption]);
        setStudyFormatName('');
        setTimeout(() => {
            studyFormatInputRef.current?.focus();
        }, 0);
    };

    return (
        <Layout style={{ width: "100%", backgroundColor: '#FAFAFA', padding: '1em', borderRadius: '15px' }}
            className={'research-form-node'}>
            <Row>
                <Title level={3}>{formTitle}</Title>
            </Row>
            <Row>
                <Paragraph>
                    Please specify project details below. After saving the project, you can specify any team demographic
                    details (optional) and submit the project for admin approval.
                </Paragraph>
            </Row>
            <Row>
                <Form onFinish={handleFormFinish} form={formRef} scrollToFirstError={true} name="researchProjectForm"
                >
                    {/* The Row for all the form errors */}
                    <Row style={{ justifyContent: 'center', color: 'red' }}>
                        <Form.ErrorList errors={formErrorData} />
                    </Row>
                    {/* The row for the project title and reference name*/}
                    <Row>
                        <Col span={24}>
                            <Form.Item name="reference_name" labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true, message: 'You must add a reference name' }]}
                                label={(
                                    <HelpTextPopover questionText={"Reference Name"}
                                        helpText={"This is the your project's short title, and it will be used to reference it across the platform."}
                                    />
                                )}
                            >
                                <Input
                                    type={"text"}
                                    name="reference_name"
                                    onChange={handleChangeStudy}
                                    value={formData.reference_name}
                                    maxLength={255}
                                    showCount={true}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <Form.Item label={'Project Title'} name="title" labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true, message: 'You must add a full project title' }]}
                            >
                                <Input
                                    type={"text"}
                                    name="title"
                                    onChange={handleChangeStudy}
                                    value={formData.title}
                                    maxLength={800}
                                    showCount={true}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/* The row for project research interests */}
                    <Row>
                        <Col span={24}>
                            <Form.Item
                                label={(
                                    <HelpTextPopover questionText={'Project Keywords'}
                                        helpText={"Selecting project keywords will allow your project to be more easily matched with user interests."}
                                    />
                                )}
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }} name="research_interests"
                                rules={[{ required: true, message: 'You must add research interests' }]}
                            >
                                <TreeSelect treeData={researchInterestData.map(mapOptionsToTreeData)}
                                    treeCheckable={true}
                                    showCheckedStrategy={TreeSelect.SHOW_PARENT}
                                    treeNodeFilterProp="title"
                                    showSearch={true}
                                    name="research_interests"
                                    placeholder={'please select'}
                                    onChange={(event) => setFormData({
                                        ...formData,
                                        research_interests: event
                                    })}
                                >

                                </TreeSelect>
                            </Form.Item>
                        </Col>
                    </Row>
                    {/* Row for Partners Needed */}
                    <Row>
                        <Col span={24}>
                            <EngageRolePicker
                                initialSelectedRole={roles_needed}
                                questionLabel={"Partners Needed"}
                            />
                        </Col>
                    </Row>
                    {/* Row For Partner Commitment Description */}
                    <Row>
                        <Col span={24}>
                            <Form.Item labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }} name="partner_commitment_description"
                                rules={[{
                                    required: true,
                                    message: 'You must add a partner commitment description'
                                }]}
                                label={(
                                    <HelpTextPopover questionText={"Partner Commitment Description"}
                                        helpText={"For each partner you indicated, please estimate a rough time commitment (e.g. Patient partner: 2h/month, Researcher 1h/month)"}
                                    />
                                )}
                            >
                                <Input
                                    type={"text"}
                                    name="partner_commitment_description"
                                    onChange={handleChangeStudy}
                                    value={formData.partner_commitment_description}
                                    placeholder={"Partner Commitment Description"}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/*The row for the recruiting status, by default should be open*/}
                    <Row>
                        <Form.Item name="recruiting_status" labelCol={{ span: 24 }}
                            wrapperCol={{ span: 24 }} initialValue={"OPEN"}
                            label={(
                                <HelpTextPopover questionText={"Recruiting Status"}
                                    helpText={"Are you looking for partners to join this project on Engage?"}
                                />
                            )}
                        >
                            <Select
                                name="recruiting_status"
                                onChange={(event) => setFormData({
                                    ...formData,
                                    recruiting_status: event
                                })}
                                options={[
                                    { value: "OPEN", label: "Open" },
                                    { value: "CLOSED", label: "Closed" },
                                ]}
                            />
                        </Form.Item>
                    </Row>
                    {/* The row for the project description (summary) */}
                    <Row>
                        <Form.Item
                            name="description"
                            labelCol={{ span: 24 }}
                            wrapperCol={{ span: 24 }}
                            label={(
                                <HelpTextPopover questionText={"Project Summary"}
                                    helpText={"This should give viewers an overview of your project so they will know whether they want to be part of the team."}
                                />
                            )}
                        >
                            <TextArea rows={2} />
                        </Form.Item>
                    </Row>
                    {/* The row for the creator and the project lead */}
                    {researchProjectData.id ? null :
                        <Row>
                            <Col span={24}>
                                <Form.Item label={(
                                    <HelpTextPopover questionText={"Specify alternate Project Lead"}
                                        helpText={"Creating the project will make you the first project lead."}
                                    />
                                )}
                                    name="alternate_lead" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                >
                                    <UserSearchBox formName={"alternate_lead"}
                                        onUserSelected={(userData) => {
                                            formRef.setFieldsValue({
                                                alternate_lead: userData.id,
                                            });
                                        }}
                                        initialUser={researchProjectData.alternate_lead_name}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    }
                    {/* Specify PI's */}
                    {researchProjectData.id ? null :
                        <Row>
                            <Col span={24}>
                                <Form.Item label={(
                                    <HelpTextPopover questionText={"Specify PI(s) for the project"}
                                        helpText={"You can't add PI(s) once the project is created."}
                                    />
                                )}
                                    name="principal_investigators" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                >

                                    <MultipleUserSearchBox formName={"principal_investigators"}
                                        onUserSelected={(userData) => {
                                            formRef.setFieldsValue({ principal_investigators: userData.map((user) => user.id) });
                                        }}
                                        mode="multiple"
                                    />

                                </Form.Item>
                            </Col>
                        </Row>
                    }
                    {/* The row for the start and end dates */}
                    <EstimatedDates
                        compKey={"start"}
                        dateType={'Start'} // start or end
                        initialItemDateType={Constants.DATE_TYPES[start_date_type]} // initial date type which will be set by the state
                        dateOptions={[Constants.DATE_TYPES.MONTH_YEAR, Constants.DATE_TYPES.YEAR]}
                        initialDate={momentStartDate}
                        initialDateDecided={is_using_start_date}
                    />

                    <EstimatedDates
                        compKey={"end"}
                        dateType={'End'} // start or end
                        initialItemDateType={Constants.DATE_TYPES[end_date_type]} // initial date type which will be set by the state
                        dateOptions={[Constants.DATE_TYPES.MONTH_YEAR, Constants.DATE_TYPES.YEAR]}
                        initialDateDecided={is_using_end_date}
                        initialDate={momentEndDate}
                    />
                    {researchProjectData.id && <Row>
                        <Title level={4}>Project Settings:</Title>
                    </Row>}
                    {/* The Row for the project visibility settings (private/ public)*/}
                    <Row gutter={[24, 24]}>
                        <Col span={researchProjectData.id ? 12 : 24}>
                            <Form.Item label={(
                                <HelpTextPopover questionText={"Project Visibility"}
                                    helpText={"A Private project will not be seen in the projects page but can still be worked on. Public projects can be seen anywhere by any user."}
                                />
                            )}
                                name="is_public" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                            >
                                <Select
                                    name="is_public"
                                    defaultValue='PUBLIC'
                                    onChange={(event) => setFormData({
                                        ...formData,
                                        is_public: (event === 'PUBLIC')
                                    })}
                                    options={[
                                        { value: "PUBLIC", label: "Public" },
                                        { value: "PRIVATE", label: "Private" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        {/* The Row for the project archive settings (Archived/Do not archive)*/}
                        {researchProjectData.id && (
                            <Col span={12}>
                                <Form.Item label={(
                                    <HelpTextPopover questionText={"Archive Project"}
                                        helpText={"A project marked as \"Archived\" will be visible on the project page only when its visibility is set to \"Public,\". Archive projects can be seen anywhere by any user."}
                                    />
                                )}
                                    name="is_archived" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                >
                                    <Select
                                        name="is_archived"
                                        options={[
                                            { value: true, label: "Archive" },
                                            { value: false, label: "Do Not Archive" },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                        )}
                    </Row>

                    {/* The row for project type and study format */}
                    <Row>
                        <Col span={24}>
                            <Form.Item label={'Project Type'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                name="type">
                                <Select
                                    name="study_type"
                                    onChange={(event) => setFormData({
                                        ...formData,
                                        type: event
                                    })}
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <Divider
                                                style={{
                                                    margin: '8px 0',
                                                }}
                                            />
                                            <Space
                                                style={{
                                                    padding: '0 8px 4px',
                                                }}
                                            >
                                                <Input
                                                    placeholder="Other"
                                                    ref={studyTypeInputRef}
                                                    value={studyTypeName}
                                                    onChange={onCustomTypeInputChange}
                                                />
                                                <Button type="text" onClick={addOptionToStudyTypeSelect}>
                                                    Add
                                                </Button>
                                            </Space>
                                        </>
                                    )}
                                    options={studyTypeOptions}
                                />

                            </Form.Item>
                        </Col>

                    </Row>
                    <Row>
                        <Col span={24}>
                            <Form.Item label={'Research Study Format (select all that apply)'} labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }} name="study_format"
                            >
                                <Select
                                    name="study_format"
                                    mode="multiple"
                                    onChange={(event) => setFormData({
                                        ...formData,
                                        study_format: event
                                    })}
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <Divider
                                                style={{
                                                    margin: '8px 0',
                                                }}
                                            />
                                            <Space
                                                style={{
                                                    padding: '0 8px 4px',
                                                }}
                                            >
                                                <Input
                                                    placeholder="Other"
                                                    ref={studyFormatInputRef}
                                                    value={studyFormatName}
                                                    onChange={onCustomFormatInputChange}
                                                />
                                                <Button type="text" onClick={addOptionToStudyFormatSelect}>
                                                    Add
                                                </Button>
                                            </Space>
                                        </>
                                    )}
                                    options={studyFormatOptions}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/* The row for multi centre vs single centre trials */}
                    <Row>
                        <Col span={24}>
                            <Form.Item label={'Single or multi-site study?'} labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }} name="centre_format"
                            >
                                <Radio.Group
                                    type={"text"}
                                    name="centre_format"
                                    onChange={(event) => setFormData({
                                        ...formData,
                                        centre_format: event
                                    })}
                                >
                                    <Radio value={"Single-Centre"}>Single-Centre</Radio>
                                    <Radio value={"Multi-Centre"}>Multi-Centre</Radio>
                                    <Radio value={"N/A"}>N/A</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>
                    {/* Row for Contact Info */}
                    <Row>
                        <Col span={12}>
                            <Form.Item label={'Main Contact'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                name="main_contact"
                            >
                                <UserSearchBox formName={"main_contact"}
                                    onUserSelected={(userData) => {
                                        formRef.setFieldsValue({
                                            main_contact: userData.id,
                                            contact_email: userData.email
                                        });
                                    }}
                                    initialUser={formData.main_contact_profile?.name}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label={'Contact Email'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                name="contact_email"
                            >
                                <Input
                                    type={"email"}
                                    name="contact_email"
                                    onChange={handleChangeStudy}
                                    value={formData.contact_email}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/* Row for Checkbox is contact visible */}
                    <Row>
                        <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} name="is_contact_visible"
                            valuePropName="checked"
                        >
                            <Checkbox
                                rows={4}
                                name="is_contact_visible"
                                onChange={(event) => setFormData({
                                    ...formData,
                                    is_contact_visible: event
                                })}
                            >
                                Contact email visible to approved team members
                            </Checkbox>
                        </Form.Item>
                    </Row>
                    <Row>
                        <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} valuePropName={"checked"}
                            name="has_social_media_links"
                        >
                            <Checkbox
                                rows={4}
                                name="has_social_media_links"
                                onChange={(event) => {
                                    setFormData({
                                        ...formData,
                                        has_social_media_links: event.target.checked
                                    });
                                    setHasSocialMediaLinks(event.target.checked);
                                }}
                            >
                                Do you have any social media/ website links for this research study you would like to
                                share?
                            </Checkbox>
                        </Form.Item>
                    </Row>
                    {/* Row for we have social media / website links */}
                    {
                        (hasSocialMediaLinks)
                            ? (
                                <>
                                    <Row>
                                        <Col span={24}>
                                            <Form.Item label={'Study Website'} labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                name="website_link"
                                            >
                                                <Input
                                                    type={"url"}
                                                    name="website_link"
                                                    onChange={handleChangeStudy}
                                                    value={formData.website_link}
                                                    placeholder={"https://website.com"}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={24}>
                                            <Form.Item label={'Twitter'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                                name="twitter_link"
                                            >
                                                <Input
                                                    type={"url"}
                                                    name="twitter_link"
                                                    onChange={handleChangeStudy}
                                                    value={formData.twitter_link}
                                                    placeholder={"https://www.twitter.com/username/"}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={24}>
                                            <Form.Item label={'Facebook'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                                name="facebook_link"
                                            >
                                                <Input
                                                    type={"url"}
                                                    name="facebook_link"
                                                    onChange={handleChangeStudy}
                                                    value={formData.facebook_link}
                                                    placeholder={"https://www.facebook.com/account/"}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={24}>
                                            <Form.Item label={'Instagram'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                                name="instagram_link"
                                            >
                                                <Input
                                                    type={"url"}
                                                    name="instagram_link"
                                                    onChange={handleChangeStudy}
                                                    value={formData.instagram_link}
                                                    placeholder={"https://www.instagram.com/account/"}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={24}>
                                            <Form.Item label={'Research Gate'} labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                name="research_gate_link"
                                            >
                                                <Input
                                                    type={"url"}
                                                    name="research_gate_link"
                                                    onChange={handleChangeStudy}
                                                    value={formData.research_gate_link}
                                                    placeholder={"https://www.researchgate.net/profile/name/"}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </>
                            )
                            : null
                    }
                    {/* Row for if the project is complete, will only show in editing mode */}
                    {(researchProjectData.id)
                        ? (
                            <Row>
                                <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} name="is_complete"
                                    valuePropName="checked"
                                    label={
                                        <HelpTextPopover questionText={"Completed Research Study?"}
                                            helpText={"Have you completed the research study and are you ready to mark this project as complete?"}
                                        />
                                    }
                                >
                                    <Checkbox
                                        rows={4}
                                        name="is_complete"
                                        onChange={(event) => setFormData({
                                            ...formData,
                                            is_complete: event
                                        })}
                                    >
                                        Mark Complete
                                    </Checkbox>
                                </Form.Item>
                            </Row>
                        )
                        : null

                    }
                    {/* TODO: Row for Institution Hospital or University */}
                    <Row align={'middle'} justify={"space-between"}>
                        {researchProjectData.id && researchProjectData.user_permissions.is_project_lead ?
                            <Button type={"primary"} onClick={() => setDeleteProjectModal(true)}
                                loading={isLoadingMutation}>Delete</Button>
                            : null
                        }
                        <Button type={"primary"} htmlType={"submit"} loading={isLoadingMutation}>Save</Button>
                    </Row>
                </Form>
            </Row>
            {deleteProjectModal ?
                <ModalPopup
                    title="Delete Project"
                    visible={deleteProjectModal}
                    handleOk={() => handleDeleteProjectCallback(researchProjectData.id)}
                    handleCancel={() => setDeleteProjectModal(false)}
                    type="info"
                    disableScreenTouch={true}
                    footerButton="Delete Project"
                    centered={true}
                    width={650}
                >
                    <Row align={'center'}>
                        <h1 style={projectManagementStyles.warningTitle}>Warning!</h1>
                        <h2 style={projectManagementStyles.userDeleteTitle}>
                            Deleting a project means, all their data will be deleted including tasks and their messages.
                            Please confirm the project detail first.
                        </h2>
                    </Row>
                    <Row>
                        <Col span={12}><span style={projectManagementStyles.fieldName}>Project Title: </span> <span
                            style={projectManagementStyles.fieldValue}>{researchProjectData?.title}</span>
                        </Col>
                        <Col span={12}><span style={projectManagementStyles.fieldName}>Creator: </span> <span
                            style={projectManagementStyles.fieldValue}>{researchProjectData.creator_name}</span>
                        </Col>
                        <Col span={24}><span style={projectManagementStyles.fieldName}>Number of Tasks: </span> <span
                            style={projectManagementStyles.fieldValue}>{researchProjectData?.tasks?.length}</span>
                        </Col>
                    </Row>
                </ModalPopup> : null}
        </Layout>
    );
}

const projectManagementStyles = {
    warningTitle: {
        color: 'red',
        textAlign: 'center',
        fontWeight: 'bolder',
    },
    userDeleteTitle: {
        fontSize: '1.2em',
        color: 'var(--primary-color-1)',
    },
    fieldName: {
        fontSize: '1.2em',
        fontWeight: 'bold',
    },
    fieldValue: {
        fontSize: '1.2em'
    }
};
