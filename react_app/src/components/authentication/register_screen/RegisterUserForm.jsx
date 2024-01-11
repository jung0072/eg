import { CheckCircleOutlined } from "@ant-design/icons";
import { Button, Checkbox, Col, Form, Input, Row, Select, Typography } from "antd";
import React, { createRef, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAvatarUploader } from '../../../components/user_profile/user_avatar_uploader';
import { useGetCitiesQuery, useSignupMutation } from '../../../redux/services/authAPI';
import { useSaveUserProfileMutation } from "../../../redux/services/userAPI";
import { HelpTextPopover } from "render-chan";
import { Constants, HandleFormRouting, openNotification, renderFormErrors } from "../../utils";
import ModalPopup from "../../utils/ModalPopup.jsx";
import PrivacyPolicy from "../PrivacyPolicy";
import TermsOfUse from "../TermsOfUse";
import REBInformationSheet from "../REBInformationSheet";
import "./register_user.css";
import UserBreadCrumbs from "../../user_profile/UserBreadCrumbs";
import SelectEngageRoleInput from "../../utils/SelectEngageRoleInput";
import { HumanizedUserRoles } from "../../utils/constants.jsx";

// TODO: Once the content is confirmed for the below screens; import the contents
// import PrivacyPolicyContent from "../../privacy_policy/PrivacyPolicyContent";
// import TermsOfServicesContent from "../../terms_of_services/TermsOfServicesContent";
// import NotificationSettingsContent from "../../notification_settings/NotificationSettingsContent";

const { Option } = Select;
const { Title } = Typography;

const registrationFormStyles = {
    form: {
        width: '620px',
    },
    title: {
        textAlign: 'center'
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: '5px',
        height: '40px',
        width: '228px',
        border: '1px solid #AFAFAF'
    },
    option: {
        backgroundColor: '#F5F5F5',
    },
    // Spread out the full input styles after input to get both styles and overrides
    fullInput: {
        width: '100%',
    },
    fullRow: {
        width: '538px'
    },
    button: {
        filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
        backgroundColor: '#002E6D',
        width: '307px',
        height: '58px',
        borderRadius: '75px',
        fontWeight: 700,
        fontSize: '24px',
        color: '#FFFFFF'
    },
};

const INITIAL_USER_OBJECT = {
    user: {
        first_name: "",
        last_name: "",
        email: "",
        username: "",
        password: "",
        password2: "",
    },
    user_profile: {
        user_location: "",
        icu_location: "",
        icu_institute: "",
        role: "",
        pronouns: [],
        is_anonymous: null,
        opt_out_project_invitations: null,
    }
};

// TODO: Refactor and add a request to get these items from the backend
const initialHospitals = [
    "Children’s Hospital of Eastern Ontario (CHEO), Ottawa",
    "SickKids, Toronto",
    "London Health Sciences Centre, London",
    "McMaster Children’s Hospital, Hamilton",
    "Montreal Children’s Hospital, Montreal",
    "IWK Health Centre, Halifax",
    "Centre Hospitalier Universitaire de Québec (Centre mère-enfant Soleil), Quebec City",
    "CHU Sainte-Justine, Montreal",
    "Winnipeg Children’s Hospital",
    "Jim Pattison Children’s Hospital, Saskatoon",
    "Stollery Children’s Hospital, Edmonton",
    "Alberta Children’s Hospital, Calgary",
    "BC Children’s Hospital, Vancouver",
    "Janeway Medical Centre, St. John’s",
    "Sherbrooke",
];

// If isEditing is False, we are creating (registering) a new user, if isEdit is true
// show the extra fields needed (user location, icu_institute, pronouns)
export default function RegisterUserForm(
    {
        isEditing = false,
        initialUserData = {},
        description = '',
        nextButtonCallback = () => null,
        formHook
    }
) {

    const {
        data: canadianCities,
        isLoading: isLoadingCities,
        isError: isErrorCities,
    } = useGetCitiesQuery();

    const [signup, { isSuccess: isSuccessSignup, isLoading: isLoadingSubmit }] = (isEditing)
        ? useSaveUserProfileMutation()
        : useSignupMutation();
    const navigate = useNavigate();
    const formRef = createRef();
    const [formData, setFormData] = useState({ ...INITIAL_USER_OBJECT, ...initialUserData });

    // user global visibility settings
    const [isAnon, setIsAnon] = useState(false);
    const [isOptOutFromProject, setIsOptOutFromProject] = useState(false);

    const [showAnonFields, setShowAnonFields] = useState(false)
    const [formErrorData, setFormErrorData] = useState([]);
    const [privacyPolicyModal, setPrivacyPolicyModal] = useState(false);
    const [termsOfServiceModal, setTermsOfServiceModal] = useState(false);
    const [isREBModalVisible, setIsREBModalVisible] = useState(true);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [isNotificationSettingModalVisible, setIsNotificationSettingModalVisible] = useState(false);
    const handleChangeUser = useCallback((e) => {
        setFormData({
            ...formData,
            user: { ...formData.user, [e.target.name]: e.target.value }
        });
        formHook.setFieldValue({ [e.target.name]: e.target.value });
    });
    // handle successful registration modal popup
    const handleOk = () => {
        navigate('/');
    };

    useEffect(() => {
        formHook.setFieldsValue(initialUserData);
        // set the user settings on form load
        setIsOptOutFromProject(initialUserData.opt_out_project_invitations);
        setIsAnon(initialUserData.is_anonymous);

        // show Anon form fields only when user is editing and role matches anonFeatureRole
        setShowAnonFields(isEditing && Object.values(HumanizedUserRoles).includes(initialUserData.role));

    }, [initialUserData]);
    // handle the agreement on change modal popup 
    const handleOkNotificationSettings = () => {
        // TODO: replace with the actual logic when confirmed with the client
        console.log('clicked ok');
    };

    const handleCancelNotificationSettings = () => {
        setIsNotificationSettingModalVisible(false);
    };

    const handleSubmit = useCallback(async () => {
        signup({
            user: formData.user,
            user_profile: formData.user_profile,
            method: (isEditing) ? 'PATCH' : null
        }).then(({ data, error }) => {
            if (error) {
                renderFormErrors(
                    error, setFormErrorData,
                    (isEditing) ? "Error Saving Account!" : "Error Registering Account!"
                );
            } else if (data) {
                if (isEditing) {
                    nextButtonCallback();
                    formHook.setFieldsValue({ ...formData.user, ...formData.user_profile });
                    openNotification({
                        message: "Updated User Profile",
                        description: `${data.success}`,
                        placement: 'topRight',
                        icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                    });
                } else {
                    setIsPopupVisible(true);
                }
            }
            return false;
        }).catch(console.error);
    });

    if (isLoadingCities) {
        return (
            <div>Loading...</div>
        );
    }

    if (isErrorCities || !canadianCities) {
        return (<div>Could not load cities</div>);
    }
    const canadianCityOptions = canadianCities.map(city => (
        <Option key={`city-${city.id}`} value={city.id} style={registrationFormStyles.option}>{city.name}</Option>
    ));

    const handleAnonChange = (e) => {
        const isChecked = e.target.checked;
        setIsAnon(isChecked);
        const isOptOutFromProject = isChecked; // isOptOutFromProject depends on isAnon
    
        setFormData({
            ...formData,
            user_profile: {
                ...formData.user_profile,
                'is_anonymous': isChecked,
                'opt_out_project_invitations': isOptOutFromProject,
            }
        });

        setIsOptOutFromProject(isOptOutFromProject); // Update isOptOutFromProject state
    };

    return (
        <Row>
            {isEditing &&
                <Col span={6} style={{ display: 'flex', justifyContent: 'center', paddingTop: '30px' }}>
                    <UserAvatarUploader
                        userId={formData.user_id}
                        fullName={`${formData.first_name} ${formData.last_name}`}
                        size={150}
                    />
                </Col>
            }
            <Col span={18}>
                <Form onFinish={handleSubmit} ref={formRef} className="register-main"
                    style={{ ...registrationFormStyles.form }}
                    initialValues={initialUserData} form={formHook}
                >
                    {
                        (isEditing)
                            ? (<>
                                <h1 className={"form-title"}>Basic Information</h1>
                                <UserBreadCrumbs userData={initialUserData} type={"FORM"} />
                            </>)
                            : (<Title style={registrationFormStyles.title}>Sign up to Engage ICU</Title>)
                    }
                    {
                        (isEditing)
                            ? (<p>{description}</p>)
                            : null
                    }
                    <Row style={{ justifyContent: 'center', color: 'red' }}>
                        <Form.ErrorList errors={formErrorData} />
                    </Row>
                    {showAnonFields && (
                        <>
                            <Row gutter={[24, 24]}>
                                <Col span={24}>
                                    <Form.Item
                                        labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                        name="is_anonymous"
                                        help={"Note: If you request to join a project, your profile will be \
                                            visible to the project lead and (if approved to the project) other team members."
                                        }
                                    >
                                        <Checkbox
                                            checked={isAnon}
                                            onChange={handleAnonChange}
                                        >
                                            <div style={{ fontWeight: '700' }}>
                                                I want to remain anonymous within the community.
                                            </div>
                                            <div style={{ color: 'red', padding: '0.5rem 0' }}>
                                                Checking this box means your profile is not visible to other users in the community.
                                                We ask that you please still complete your profile, so it can be reported with
                                                aggregate site data (i.e. grouped with all other users). You may uncheck this
                                                box to join the community at any time!
                                            </div>
                                        </Checkbox>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                        name="opt_out_project_invitations"
                                    >
                                        <Checkbox
                                            checked={isOptOutFromProject}
                                            disabled={isAnon}
                                            onChange={(e) => {
                                                setIsOptOutFromProject(e.target.checked);
                                                setFormData({
                                                    ...formData,
                                                    user_profile: { ...formData.user_profile, 'opt_out_project_invitations': e.target.checked, 'is_anonymous': isAnon }
                                                })
                                            }}
                                        >
                                            <span style={{ display: 'flex' }}>
                                                <span style={{ fontWeight: '700' }}>
                                                    I want to be visible within the community but not invited to
                                                    join research projects.
                                                </span>
                                                <HelpTextPopover questionText={""}
                                                    helpText={"If you chose to remain anonymous, \
                                                    this box is automatically checked since your profile is not \
                                                    visible to the community."}
                                                />
                                            </span>
                                            <div style={{ color: 'red', padding: '0.5rem 0' }}>
                                                Checking this box means that project leads cannot invite you to join their projects.
                                                Like other users, you may still request to join projects and project leads may accept
                                                or decline your request. You may uncheck this box to receive invitations to join
                                                projects at any time!
                                            </div>
                                        </Checkbox>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </>
                    )}
                    <Row>
                        <Col span={12}>
                            <Form.Item label={'Username'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                name="username"
                                rules={[{ required: true }]}
                            >
                                <Input
                                    type={"text"}
                                    name="username"
                                    onChange={handleChangeUser}
                                    value={formData.user.username}
                                    style={registrationFormStyles.input}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label={'Email'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                rules={[{ required: true }]} name="email"
                            >
                                <Input
                                    name="email"
                                    onChange={handleChangeUser}
                                    value={formData.user.email}
                                    style={registrationFormStyles.input}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={12}>
                            <Form.Item label={'First Name'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                rules={[{ required: true }]} name="first_name"
                            >
                                <Input
                                    name="first_name"
                                    onChange={handleChangeUser}
                                    value={formData.user.first_name}
                                    style={registrationFormStyles.input}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label={'Last Name'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                rules={[{ required: true }]} name="last_name"
                            >
                                <Input
                                    name="last_name"
                                    onChange={handleChangeUser}
                                    value={formData.user.last_name}
                                    style={registrationFormStyles.input}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/* Show the row for password inputs only if we are creating a user not editing*/}
                    {
                        (isEditing)
                            ? null
                            : (
                                <>
                                    <Row>
                                        <Col span={24}>
                                            <Form.Item label={'Password'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                                style={registrationFormStyles.fullRow} rules={[{ required: true }]}
                                                name="password"
                                            >
                                                <Input.Password
                                                    type={"password"}
                                                    name="password"
                                                    onChange={handleChangeUser}
                                                    value={formData.user.password}
                                                    style={{ ...registrationFormStyles.input, ...registrationFormStyles.fullInput }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={24}>
                                            <Form.Item label={'Confirm Password'} labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                style={registrationFormStyles.fullRow} rules={[{ required: true }]}
                                                name="password2"
                                            >
                                                <Input.Password
                                                    type={"password"}
                                                    name="password2"
                                                    onChange={handleChangeUser}
                                                    value={formData.user.password2}
                                                    style={{ ...registrationFormStyles.input, ...registrationFormStyles.fullInput }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </>
                            )
                    }
                    {/* Show the row for location and institution if we are editing a user not creating */}
                    {
                        (isEditing)
                            ? (
                                <>
                                    <Row>
                                        <Col span={12}>
                                            <Form.Item label={'City'} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                                                rules={[{ required: false }]} name="user_location"
                                            >
                                                <Select
                                                    name="user_location"
                                                    onChange={(value) => setFormData({
                                                        ...formData,
                                                        user_profile: { ...formData.user_profile, 'user_location': value }
                                                    })}
                                                    value={formData.user_profile.user_location}
                                                    style={registrationFormStyles.input}
                                                    showSearch={true}
                                                    filterOption={(input, option) =>
                                                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                                    }
                                                    optionFilterProp={'children'}
                                                >
                                                    {canadianCityOptions}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label={'Institution (ICU)'} labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                rules={[{ required: false }]} name="icu_institute"
                                            >
                                                <Select
                                                    name="icu_institute"
                                                    onChange={(value) => setFormData({
                                                        ...formData,
                                                        user_profile: { ...formData.user_profile, 'icu_institute': value }
                                                    })}
                                                    value={formData.user_profile.icu_location}
                                                    style={registrationFormStyles.input}
                                                    showSearch={true}
                                                    filterOption={(input, option) =>
                                                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                                    }
                                                    optionFilterProp={'children'}
                                                >
                                                    {initialHospitals.map((icu, idx) => (
                                                        <Option key={idx} value={icu}>{icu}</Option>))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={24}>
                                            <Form.Item
                                                label={<HelpTextPopover questionText={"What are your preferred pronouns?"}
                                                    helpText={"Select an option or type in your preferred pronouns."}
                                                />}
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                rules={[{ required: false }]} name="pronouns"
                                            >
                                                <Select
                                                    name="pronouns"
                                                    onChange={(value) => {
                                                        // Check and remove options based on if the user chose I prefer not to answer
                                                        const notApplicableValue = "I prefer not to answer";
                                                        const oldValue = formData.user_profile.pronouns;
                                                        const newValue = (value.includes(notApplicableValue))
                                                            ? (oldValue.length === 1 && oldValue[0] === notApplicableValue)
                                                                ? value.filter(val => val !== notApplicableValue)
                                                                : [notApplicableValue]
                                                            : value;

                                                        // once we have the new value set into the form data and also the
                                                        // the forkHook field value
                                                        setFormData({
                                                            ...formData,
                                                            user_profile: {
                                                                ...formData.user_profile,
                                                                'pronouns': newValue
                                                            }
                                                        });
                                                        formHook.setFieldValue('pronouns', newValue);
                                                    }}
                                                    value={formData.user_profile.pronouns}
                                                    style={{ ...registrationFormStyles.input, ...registrationFormStyles.fullRow }}
                                                    mode="multiple"
                                                >
                                                    <Option key="pronoun-1" value="She/her">She/her</Option>
                                                    <Option key="pronoun-2" value="He/him">He/him</Option>
                                                    <Option key="pronoun-3" value="They/them">They/them</Option>
                                                    <Option key="pronoun-4" value="Ze/zir">Ze/zir</Option>
                                                    <Option key="pronoun-5" value="I prefer not to answer">
                                                        I prefer not to answer
                                                    </Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </>
                            )
                            : null
                    }
                    <Row style={registrationFormStyles.fullRow}>
                        <Col span={24}>
                            <SelectEngageRoleInput
                                handleOnChange={(value) => setFormData({
                                    ...formData,
                                    user_profile: { ...formData.user_profile, 'role': value }
                                })}
                                roleValue={formData.user_profile.role}
                                disabled={isEditing}
                                inputStyle={{ ...registrationFormStyles.input, ...registrationFormStyles.fullInput }}
                            />
                        </Col>
                    </Row>
                    {/* Only show the acceptance agreement if we are creating a user*/}
                    {
                        (isEditing)
                            ? null
                            : (
                                <Row style={{ justifyContent: 'center' }}>
                                    <Col span={20}>
                                        {/* Rules taken from from the ant-d docs Forms > Registration */}
                                        <Form.Item valuePropName={"checked"} name={"agreement"}
                                            rules={[{
                                                required: true,
                                                validator:
                                                    (_, value) => (value)
                                                        ? Promise.resolve()
                                                        : Promise.reject(new Error('*You must read and accept the agreement before continuing'))
                                            }]}
                                        >
                                            <Checkbox name={"agreement"}>
                                                <p>
                                                    Creating an account means you’re okay with our <Link to="#"
                                                    onClick={() => setTermsOfServiceModal(true)}>Terms
                                                                                                 of Service</Link>,
                                                    <Link to="#" onClick={() => setPrivacyPolicyModal(true)}> Privacy
                                                                                                              Policy</Link>,
                                                    <Link to="#" onClick={() => setIsREBModalVisible(true)}> Engage
                                                                                                             Information
                                                                                                             Sheet
                                                    </Link>,
                                                    and our default
                                                    <Link to="#"
                                                        onClick={() => setIsNotificationSettingModalVisible(true)}> Notification
                                                                                                                    Settings</Link>
                                                </p>
                                            </Checkbox>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )
                    }
                    {
                        (isEditing)
                            ? (
                                <Row>
                                    <HandleFormRouting form={formHook} handleNextClickAddon={nextButtonCallback}
                                        loadingState={isLoadingSubmit} hideBackButton={true}
                                    />
                                </Row>
                            )
                            : (
                                <Row style={{ justifyContent: 'center' }}>
                                    <Button type="primary" htmlType={'submit'} style={registrationFormStyles.button}
                                        loading={isLoadingSubmit}
                                    >
                                        Create Account
                                    </Button>
                                </Row>
                            )
                    }
                    {
                        (isEditing)
                            ? null : (
                                <>
                                    {/* TODO: Temporarily show content coming soon for these modals until content is approved*/}
                                    {/*<PrivacyPolicy setIsModalOpen={setPrivacyPolicyModal} isModalOpen={privacyPolicyModal}/>*/}
                                    {/*<TermsOfUse setIsModalOpen={setTermsOfServiceModal} isModalOpen={termsOfServiceModal}/>*/}
                                    <ModalPopup
                                        title="Privacy Policy"
                                        visible={privacyPolicyModal}
                                        handleOk={() => setPrivacyPolicyModal(false)}
                                        handleCancel={() => setPrivacyPolicyModal(false)}
                                        type="info"
                                        disableScreenTouch={false}
                                        footerButton=""
                                        centered={true}
                                        width={1000}
                                    >
                                        {/* <PrivacyPolicyContent /> */}
                                        <p>Content coming soon...</p>
                                    </ModalPopup>
                                    <ModalPopup
                                        title="Terms of Service"
                                        visible={termsOfServiceModal}
                                        handleOk={() => setTermsOfServiceModal(false)}
                                        handleCancel={() => setTermsOfServiceModal(false)}
                                        type="info"
                                        disableScreenTouch={false}
                                        footerButton=""
                                        centered={true}
                                        width={1000}
                                    >
                                        {/* <TermsOfServicesContent /> */}
                                        <p>Content coming soon...</p>
                                    </ModalPopup>
                                    <ModalPopup
                                        title="Notification Settings"
                                        visible={isNotificationSettingModalVisible}
                                        handleOk={handleOkNotificationSettings}
                                        handleCancel={handleCancelNotificationSettings}
                                        type="info"
                                        disableScreenTouch={false}
                                        footerButton=""
                                        centered={true}
                                        width={1000}
                                    >
                                        {/* <NotificationSettingsContent /> */}
                                        <p>Content coming soon...</p>
                                    </ModalPopup>
                                    <REBInformationSheet
                                        setIsModalOpen={setIsREBModalVisible}
                                        isModalOpen={isREBModalVisible}
                                    />
                                </>
                            )
                    }
                </Form>
            </Col>
            {
                (isPopupVisible && isEditing === false)
                    ? <ModalPopup
                        title="Your Account has been created!"
                        visible={isPopupVisible}
                        handleOk={handleOk}
                        closable={false}
                        type="success"
                        disableScreenTouch={true}
                        footerButton="Sign In"
                        centered={true}
                        width={1000}
                    >
                        <p>{Constants.ACC_SUCCESSFULLY_CREATED_DESC}</p>
                    </ModalPopup>
                    : ""
            }
        </Row>
    );
}
