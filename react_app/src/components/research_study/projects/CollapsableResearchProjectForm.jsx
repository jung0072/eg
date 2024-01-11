import React, { useCallback, useState } from 'react';
import { useParams } from "react-router-dom";
import { Layout, Collapse, Col, Row, Typography, Space, Form, Checkbox, Radio, Modal, Button } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { openNotification, renderFormErrors } from "../../utils";
import { partnerDemographicsHelpText } from "../../utils/constants.strings";
import { HelpTextPopover } from "render-chan";

const { Panel } = Collapse;
const { Text, Title, Paragraph } = Typography;

const InitialFormState = {
    has_specific_team_demographics: false,
    participant_demographics_type: 'Both'
};
export default function CollapsableResearchProjectForm(
    {
        formItemArray, researchProjectID, researchProjectData, mutationTrigger, isLoadingMutation
    }
) {
    const [formData, setFormData] = useState({ ...InitialFormState, ...researchProjectData });

    // set up the callback function for submitting this subform
    const handleFormFinish = useCallback(async (values) => {
        mutationTrigger({ ...values, id: researchProjectID }).then(({ data, error }) => {
            if (error) {
                renderFormErrors(error, null, "Error saving research project");
            } else {
                // show the user a notification on save and then navigate them to the next page after a few seconds
                openNotification({
                    message: "Updated Research Project ",
                    description: `You have updated the research project ${data.title}`,
                    placement: 'topRight',
                    icon: (<CheckCircleOutlined style={{ color: 'green' }}/>),
                });
            }
        }).catch(console.error);
    }, [mutationTrigger, researchProjectData]);

    const collapsablePanels = formItemArray.map((item, index) => (
        <Collapse bordered={false} style={researchProjectFormStyles.collapse}>
            <Panel key={`${index}`}
                   header={
                       (item.hasDefaultData)
                           ? (
                               <Title level={3} className="form-title">
                                   {item.title}
                                   <span>
                                       <CheckCircleOutlined style={{ color: '#1AB759', marginLeft: '1em' }}/>
                                   </span>
                               </Title>
                           )
                           : (<Title level={3} className="form-title">{item.title}</Title>)
                   }
            >
                <Text style={{ marginLeft: '1em', paddingBottom: '1em' }}>{item.description}</Text>
                <div style={researchProjectFormStyles.panel.container}>
                    {item.form}
                </div>
            </Panel>
        </Collapse>
    ));
    return (
        <>
            <Form scrollToFirstError={true} name="researchProjectDemographicsForm" onFinish={handleFormFinish}
                  initialValues={formData} className={'research-form-node'} style={researchProjectFormStyles.form}
            >
                <Row>
                    <Title level={3}>Select Team Demographics</Title>
                </Row>
                <Row>
                    <Paragraph style={{ marginTop: '1em' }}>
                        By looking for partners with specific criteria, the Engage platform will suggest your project to
                        users who meet some/all of your criteria. The system will also show you partners who meet
                        some/all of your criteria according to filterable percent match. Please note: although the
                        system will match users with the EDI criteria you specify and suggest them, it will not specify
                        which (if any) criteria they meet if they have chosen to keep EDI information private. When you
                        are ready to submit this project for admin approval, click 'Submit for Review'
                    </Paragraph>
                </Row>
                <Button style={researchProjectFormStyles.button} type={"primary"} htmlType={"submit"}
                        loading={isLoadingMutation}
                >
                    Save
                </Button>
                <Row>
                    <Form.Item>
                        <Row>
                            <Col span={24}>
                                <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                           name="has_specific_team_demographics" valuePropName="checked"
                                           label={"Do you have specific demographic criteria when searching for team members?"}
                                >
                                    <Radio.Group
                                        onChange={event => setFormData(prev => ({
                                            ...prev,
                                            has_specific_team_demographics: event.target.value
                                        }))}
                                        value={formData.has_specific_team_demographics}
                                        name="has_specific_team_demographics"
                                    >
                                        <Space direction="vertical">
                                            <Radio value={false}>
                                                Make everyone aware of this project (no specific criteria for partners)
                                            </Radio>
                                            <Radio value={true}>
                                                Look for partners with specific criteria
                                            </Radio>
                                        </Space>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form.Item>
                </Row>
                {
                    (formData.has_specific_team_demographics === true)
                        ? (
                            <Row>
                                <Form.Item>
                                    <Row>
                                        <Col span={24}>
                                            <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                                       name="participant_demographics_type"
                                                       valuePropName={"value"}
                                                       label={(<HelpTextPopover
                                                               questionText={"What kind of partners are you looking for?"}
                                                               helpText={partnerDemographicsHelpText}/>
                                                       )}
                                            >
                                                <Radio.Group
                                                    onChange={event => setFormData(prev => ({
                                                        ...prev,
                                                        participant_demographics_type: event.target.value
                                                    }))}
                                                    value={formData.participant_demographics_type}
                                                    name="participant_demographics_type"
                                                    defaultValue={formData.participant_demographics_type}
                                                >
                                                    <Space direction="vertical">
                                                        <Radio value="RESEARCHER">
                                                            Researchers/ Clinicians
                                                        </Radio>
                                                        <Radio value="PATIENT">
                                                            Patient Partner/ Family of Patient
                                                        </Radio>
                                                        <Radio value="ALL">
                                                            Both
                                                        </Radio>
                                                    </Space>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Form.Item>
                            </Row>
                        )
                        : null
                }
            </Form>

            {(formData.has_specific_team_demographics === true)
                ? (
                    <Space direction={'vertical'}>
                        {collapsablePanels[0]}
                        {
                            (formData.participant_demographics_type === "RESEARCHER" || formData.participant_demographics_type === "ALL")
                                ? (
                                    <>
                                        {collapsablePanels[1]}
                                        {collapsablePanels[2]}
                                    </>
                                )
                                : null
                        }
                        {
                            (formData.participant_demographics_type === "PATIENT" || formData.participant_demographics_type === "ALL")
                                ? (
                                    <>
                                        {collapsablePanels[3]}
                                        {collapsablePanels[4]}
                                    </>
                                )
                                : null
                        }
                    </Space>
                )
                : null
            }
        </>
    );
}

const researchProjectFormStyles = {
    collapse: {
        borderRadius: '15px',
        minWidth: '70vw'
    },
    panel: {
        container: {
            borderTop: '1px solid black',
            marginLeft: '1.5em',
            paddingTop: '2em'
        },
        title: {
            fontSize: '16px',
            fontFamily: 'Inter',
            color: '#25282B',
            fontWeight: 600
        }
    },
    button: {
        filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
        backgroundColor: '#002E6D',
        borderRadius: '75px',
        width: '140px',
        height: '45px',
        fontWeight: 600,
        fontSize: '16px',
        color: '#FFFFFF',
        position: 'absolute',
        top: 0,
        right: '1em',
        // marginRight: '9.5em'
    },
    form: {
        backgroundColor: '#FAFAFA',
        padding: '1em',
        minWidth: '70vw',
        borderRadius: '15px',
        marginBottom: '2em',
        position: 'relative'
    }
};
