import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useContactMutation } from '../redux/services/authAPI';
import { Affix, Button, Col, Form, Input, Layout, Result, Row, Select, Typography } from 'antd';
import { Colours, Constants, NotificationTypes, openNotification } from "../components/utils";
import { CheckCircleFilled, InfoCircleFilled } from "@ant-design/icons";
import '../components/contact_log/contact_us_content.css';
import { useGetUserDataQuery } from "../redux/services/userAPI";
import { Link, useNavigate } from 'react-router-dom';
import { useEngageStylingLayout } from '../providers/EngageLayoutStylingContextProvider';
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { WebPageInfoContext } from "../providers/WebPageInfoContextProvider";
import { UploadScreenshotInput } from "../components/contact_log/UploadScreenshotInput.jsx";
import {
    contactLogSubmitBugConfirmation,
    contactLogSubmitSuggestionConfirmation
} from "../components/utils/constants.strings";
import { UnauthenticatedFooter, UnauthenticatedHeader } from "../components/unauthenticated";

const {Content} = Layout;
const {Title, Text} = Typography;
const {TextArea} = Input;

export default function ContactUsScreen({ isUserAuthenticated }) {

    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);
    const { webPageInfo, clearWebPageInfo } = useContext(WebPageInfoContext);

    // if form is submitted, show the Result screen
    const [formShow, setFormShow] = useState(false);
    // show/hide options for IT enquiry type
    const [isEnquiryIT, setIsEnquiryIT] = useState(false)
    const [isSuggestion, setIsSuggestion] = useState(false)
    const [form] = Form.useForm();
    const [contacted] = useContactMutation();
    const navigate = useNavigate()
    const [imageURL, setImageURL] = useState(null)

    // scroll to the top of the page on load because
    // Contact Us link is in the footer
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const {
        data: userData,
    } = useGetUserDataQuery();

    // useEffect Hook for component did mount
    useEffect(() => {
        if (isUserAuthenticated) {
            // remove the padding
            removeLayoutPadding(true);
            // remove the white background color
            changeBackgroundColor(false);
            // clear out the active nav menu context since this isn't in the main nav
            updateActiveNavigationMenu('')
        }
    }, []);
    // check whether user is logged in to show first name, last name, and email details or not
    const showDetail = (!userData);
    useEffect(() => {
        if(!showDetail) {
            navigate('/app/contact_us/')
        }
    }, [showDetail])


    const handleDone = useCallback(() => {
        form.resetFields();
        setFormShow(false);
        navigate('/home/')
    }, [form, setFormShow, navigate]);

    const handleEnquiryType = (value) =>{
        switch (value) {
            case Constants.ENQUIRY_OPTIONS[0].value:
                setIsEnquiryIT(true);
                setIsSuggestion(false);
                break;
            case Constants.ENQUIRY_OPTIONS[4].value:
                setIsEnquiryIT(false);
                setIsSuggestion(true);
                break;
            default:
                setIsEnquiryIT(false);
                setIsSuggestion(false);
                form.setFieldValue('support_type', null);
                break;
        }
    }

    const handleSubmit = async (values) => {
        await contacted({values: { ...values, screenshot: imageURL }, is_user: showDetail}).unwrap()
            .then((res) => {
                if(res.success) {
                    clearWebPageInfo()
                    setFormShow(true)
                } else throw res.err
            })
            .catch((err) => openNotification({
                placement: 'topRight',
                message: 'There was an error creating the task',
                description: err,
                icon: (<InfoCircleFilled style={{color: 'red'}}/>),
                type: NotificationTypes.ERROR
            }));
        form.resetFields();
    };

    // useEffect hook checking for changes in the webPageInfo Context
    useEffect(() => {
        // Now check if there are any values inside the webPageInfo Context and if there is ITS form must get pre-filled
        if (webPageInfo?.screenshot && webPageInfo?.route) {
            // now that we have determined this is a bug report set the enquiry type to ITS and prefill the form
            handleEnquiryType((webPageInfo.reportBug) ? Constants.ENQUIRY_OPTIONS[0].value : Constants.ENQUIRY_OPTIONS[4].value);

            // figure out which screen they were on based on the route and set that into the form ref
            const currentScreen = Constants.SCREENS.find(screen => webPageInfo.route.match(screen.route));
            form.setFieldValue(
                'enquiry_type',
                (webPageInfo.reportBug)
                    ? Constants.ENQUIRY_OPTIONS[0].value
                    : Constants.ENQUIRY_OPTIONS[4].value
            );
            form.setFieldValue('support_screen', currentScreen.value);
        }
    }, [webPageInfo, handleEnquiryType, form]);

    const imageUploadButton = (isEnquiryIT || isSuggestion)
        ? (
            <Row>
                <Col span={24}>
                    <Form.Item
                        label={
                            (imageURL)
                                ? <>Screenshot Uploaded <CheckCircleFilled style={{ color: Colours.SUCCESS, marginLeft: '1em' }} /></>
                                : 'Upload a Screenshot'
                        }
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                        name="screenshot"
                    >
                        <UploadScreenshotInput setImageURL={setImageURL} />
                    </Form.Item>
                </Col>
            </Row>
        )
        : null;

    return (
        <Layout id='contact-us-screen'>
            {showDetail ? <UnauthenticatedHeader /> : null}
            <Layout>
                {formShow ?
                    (
                        <Layout style={contactUsStyles.resultLayout}>
                            <Content style={contactUsStyles.resultContent}>
                                <Result status="success"
                                    title="Thank You! Your Message has been sent successfully!"
                                    subTitle={(isSuggestion) ? contactLogSubmitSuggestionConfirmation : contactLogSubmitBugConfirmation}
                                    extra={[
                                        <Button style={contactUsStyles.buttonStyle} type="primary"
                                            onClick={handleDone}>Done</Button>
                                    ]}
                                />
                            </Content>
                        </Layout>
                    )
                    : (
                        <Layout style={contactUsStyles.resultLayout}>
                            <Affix>
                                <div style={contactUsStyles.contactMain}>
                                    <p style={contactUsStyles.contactTitle}>
                                        {(isSuggestion) ? 'Suggest Improvement' : 'Need Support'}
                                    </p>
                                    <h3>
                                        To view previously reported system issues / suggestions. <Link style={contactUsStyles.linkStyle} to={"system_issue/"}>Click here</Link>
                                    </h3>
                                </div>
                            </Affix>
                            <Content>
                                <Form style={contactUsStyles.mainContent} id='contact-us-form' form={form} onFinish={handleSubmit} className="contact-us">
                                    <Title>
                                        {(isSuggestion) ? 'Leave a Suggestion to Help Us Improve' : 'How can we help you?'}
                                    </Title>
                                    {showDetail && (
                                        <Row justify={'space-between'}>
                                            <Col span={11}>
                                                <Form.Item label={'First Name'} labelCol={{span: 24}}
                                                        wrapperCol={{span: 24}}
                                                        name='first_name'
                                                        rules={[{ required: true, message: 'First Name is required' }]}
                                                        style={contactUsStyles.formLabelStyle}
                                                >
                                                    <Input
                                                        type={"text"}
                                                        placeholder='John'
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={11}>
                                                <Form.Item label={'Last Name'} labelCol={{span: 24}}
                                                           wrapperCol={{span: 24}}
                                                           name='last_name'
                                                           rules={[{ required: true, message: 'Last Name is required' }]}>
                                                    <Input
                                                        type={"text"}
                                                        placeholder='Doe'
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    )}
                                    <Row justify={'space-between'}>
                                        {showDetail && (
                                            <Col span={11}>
                                                <Form.Item label={'Email Address'} labelCol={{span: 24}}
                                                           wrapperCol={{span: 24}}
                                                           name='email_address'
                                                           rules={[{ required: true, message: 'Email Address is required' }]}>
                                                    <Input
                                                        type={"text"}
                                                        placeholder='johndoe@email.com'
                                                    />
                                                </Form.Item>
                                            </Col>
                                        )}
                                        {showDetail ? (
                                        <>
                                            <Col span={11}>
                                                <Form.Item
                                                    label={'Type of Enquiry'}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                    name='enquiry_type'
                                                    rules={[{ required: true, message: 'Type of Enquiry is required.' }]}
                                                >
                                                    <Select
                                                        onChange={handleEnquiryType}
                                                        placeholder='Select one option'
                                                        options={Constants.ENQUIRY_OPTIONS}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            {(isEnquiryIT || isSuggestion) ? (
                                                <Col span={11}>
                                                    <Form.Item
                                                        label={'Select the screen'}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                        name='support_screen'
                                                        rules={[{ required: true, message: 'It is required to identify the screen or location where the error or bug occurred.' }]}
                                                    >
                                                        <Select placeholder='Select screen' options={Constants.SCREENS} />
                                                    </Form.Item>
                                                </Col>
                                            ) : ''}
                                        </>
                                    ) : (
                                        <>
                                            <Col span={11}>
                                                <Form.Item
                                                    label={'Type of Enquiry'}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                    name='enquiry_type'
                                                    rules={[{ required: true, message: 'Type of Enquiry is required' }]}
                                                >
                                                    <Select
                                                        onChange={handleEnquiryType}
                                                        placeholder='Select one option'
                                                        options={Constants.ENQUIRY_OPTIONS}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            {(isEnquiryIT || isSuggestion) ? (
                                                <Col span={11}>
                                                    <Form.Item
                                                        label={'Select the screen'}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                        name='support_screen'
                                                        rules={[{ required: true, message: 'It is required to identify the screen or location where the error or bug occurred.' }]}
                                                    >
                                                        <Select placeholder='Select screen' options={Constants.SCREENS} />
                                                    </Form.Item>
                                                </Col>
                                            ) : ''}
                                        </>
                                    )}
                                    </Row>
                                    {imageUploadButton}
                                    <Row>
                                        <Col span={24}>
                                            <Form.Item label={'Leave a Message'} labelCol={{span: 24}}
                                                       wrapperCol={{span: 24}}
                                                       name='message'
                                                       rules={[{ required: true, message: 'Message is required' }]}>
                                                <TextArea
                                                    id='leave-message-text-area'
                                                    rows={6}
                                                    placeholder='Please enter your message'
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row className='contact-us-button' justify={'center'}>
                                        <Button type="primary" htmlType={'submit'}>Submit</Button>
                                    </Row>
                                </Form>
                            </Content>
                        </Layout>
                    )}
            </Layout>
                {!showDetail ? null : <UnauthenticatedFooter />}
        </Layout>
    );
}

const contactUsStyles = {
    resultLayout: {
        position: 'relative',
    },
    resultContent: {
        padding: '100px 200px',
    },
    mainContent: {
        padding: '20px 200px',
    },
    contactMain: {
        minHeight: '48px',
        width: '100%',
        backgroundColor: '#838383',
        color: '#FFFFFF',
        padding: '50px 200px',
    },
    contactTitle: {
        fontWeight: '400',
        fontSize: '40px',
    },
    formStyle: {
        display: 'flex',
        flexDirection: 'column',
    },
    formLabelStyle: {
        color: '#282828',
        fontWeight: '500',
        fontSize: '21px'
    },
    linkStyle: {
        color: 'white',
        textDecoration: 'underline'
    }
}
