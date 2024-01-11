import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RenderChanForm } from "../components/user_profile/";
import { Colours, EngageSpinner, openNotification } from "../components/utils";
import {
    selectLoggedInUserData,
    selectLoggedInUserFormValues,
    useLazyUserRenderChanFormDataQuery
} from "../redux/services/userAPI";
import { Alert, Col, Form, Layout, Menu, Row } from 'antd';
import "../components/user_profile/profile_creation/modify_user_profile_screen.css";
import { CurrentFormSectionContext } from "../providers/CurrentFormSectionContextProvider.jsx";
import { RegisterUserForm } from "../components/authentication";
import { useDispatch, useSelector } from "react-redux";
import { getUserFormData, setUserFormData } from "../redux/slicers/userSlice";
import { useEngageStylingLayout } from '../providers/EngageLayoutStylingContextProvider';
import { CloseCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { MENU_ROUTES } from "../components/utils/constants";
import { pendingUserProfileFormCheckMessage } from "../components/utils/constants.strings";
import { UserProfileFormCompletionStatusContext } from "../providers/UserProfileFormCompletionStatusContextProvider";

const { Content } = Layout;

const basicSettingsSectionJSON = {
    title: "Basic Information",
    description: "These are your basic profile settings that may be seen everywhere around the site.",
    is_valid_researcher: true,
    is_valid_patient: true,
    is_valid_family_of_patient: true,
    is_valid_caretaker_of_patient: true,
    is_valid_passive: true,
    id: "SETTINGS"
};

const getBasicSettingsUserData = (userData) => ({
    user_id: userData.id,
    first_name: userData.first_name,
    last_name: userData.last_name,
    email: userData.email,
    username: userData.username,
    user_location: userData.user_location,
    icu_location: userData.icu_location,
    role: userData.role,
    pronouns: userData.pronouns,
    icu_institute: userData.icu_institute,
    is_anonymous: userData.is_anonymous,
    opt_out_project_invitations: userData.opt_out_project_invitations,
});

const checkBasicSettingsFormCompletion = (userData) => (userData.first_name && userData.last_name && userData.role && userData.username && userData.email);

export default function ModifyUserProfileScreen() {
    const userData = useSelector(selectLoggedInUserData);
    const initialUserProfileData = useSelector(selectLoggedInUserFormValues);
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);
    const userFormData = useSelector(getUserFormData);
    const [triggerGetUserFormData, { isLoading: isLoadingFormData }] = useLazyUserRenderChanFormDataQuery();
    const { currentFormSectionContext, setCurrentFormSectionContext } = useContext(CurrentFormSectionContext);
    const [renderedFormData, setRenderedFormData] = useState([]);
    const [displayedSection, setDisplayedSection] = useState(null);
    const [userAlert, setUserAlert] = useState('');
    // state to check if the tab was switched or not
    const [tabSwitch, setTabSwitch] = useState(false);
    // form instance for the render chan forms
    const [form] = Form.useForm();
    // form instance for the basic info
    const [basicSettingForm] = Form.useForm();
    const { userProfileCompletionStatus } = useContext(UserProfileFormCompletionStatusContext);

    const handleMenuClick = useCallback(function (clickEvent) {
        const sectionIndex = renderedFormData.findIndex(section => section.id === clickEvent.key);
        const sectionID = renderedFormData[sectionIndex].id;
        setTabSwitch(true);

        // Validate section for the basic profile form
        if (currentFormSectionContext.current === "SETTINGS") {
            basicSettingForm.validateFields().then((values) => {
                // Set the state to true that the tab was switched
                localStorage.setItem("tabSwitch", "True");
                // Set the previous section
                setCurrentFormSectionContext({
                    ...currentFormSectionContext,
                    renderedSections: renderedFormData,
                    current: sectionID,
                    previousSection: currentFormSectionContext.current
                });
                basicSettingForm.submit();
                // After submitting the form, set the state to false
                setTabSwitch(false);
            }).catch((basicSettingInfoError) => {
                // If there is any error, show the notification
                openNotification({
                    message: "Missing Required Information",
                    description: `Please fill in all required fields.`,
                    placement: 'topRight',
                    icon: (<CloseCircleOutlined style={{ color: 'red' }} />),
                    timeout: 0
                });
            });
        }

        // Validate section for render chan forms  
        if (currentFormSectionContext.current !== "SETTINGS") {
            form.validateFields().then((values) => {
                // Set the state to true that the tab was switched
                localStorage.setItem("tabSwitch", "True");
                // Check if it is the last section; if it is, then we will not submit the form
                // and let the user click on next instead
                const checkIfLastSection = sectionIndex + 1 >= renderedFormData.length;

                if (!checkIfLastSection) {
                    form.submit();
                    // After submitting the form, set the state to false
                    setTabSwitch(false);
                }
                setCurrentFormSectionContext({
                    ...currentFormSectionContext,
                    renderedSections: renderedFormData,
                    current: sectionID,
                    previousSection: currentFormSectionContext.current
                });

            }).catch((mainFormError) => {
                // If there is any error, show the notification
                openNotification({
                    message: "Missing Required Information",
                    description: `Please fill in all required fields.`,
                    placement: 'topRight',
                    icon: (<CloseCircleOutlined style={{ color: 'red' }} />),
                    timeout: 0
                });
            });
        }
    }, [userFormData, renderedFormData, currentFormSectionContext]);

    const dispatch = useDispatch();


    // useEffect hook for the component did mount lifecycle event
    useEffect(() => {
        removeLayoutPadding(true);
        changeBackgroundColor(true);
        updateActiveNavigationMenu(MENU_ROUTES[2].key);
    }, []);

    // useEffect hook to only load the welcome to engage user alert if the minimum check if false, if the
    // minimum check is ever true then we can ignore the check
    useEffect(() => {
        // Check if the user has completed their minimum profile check, if they haven't they can complete the form
        // if the user has not completed their profile check then display the banner to instruct them to fill out the profile
        if (userData?.user) {
            const { is_profile_complete: isProfileComplete } = userData.user;
            setUserAlert(previousAlert => {
                // if we don't have a previous alert we can just return null
                if (previousAlert === null) {
                    return null;
                }

                // If we did not have a null previous alert, check the user profile completion check and render
                // the userAlert based on that condition
                return (isProfileComplete)
                    ? null
                    : (
                        <Row style={{ marginBottom: '1em' }}>
                            <Alert
                                message={<strong>Welcome to 'Engage'</strong>}
                                description={pendingUserProfileFormCheckMessage}
                                type="info"
                                closable={true}
                            />
                        </Row>
                    );
            });
        }
    }, [userData]);

    useEffect(() => {
        if (!userFormData) {
            triggerGetUserFormData().then(({ data }) => dispatch(setUserFormData(data)));
        }
    }, [triggerGetUserFormData, userFormData]);

    useEffect(() => {
        setDisplayedSection(renderedFormData.filter(
            section => section.id === currentFormSectionContext.current
        ).map(section => section.form));
    }, [currentFormSectionContext, renderedFormData]);

    useEffect(() => {
        if (userFormData && userData) {
            // once we have the data, map over the sections list and build the question json from questions that match
            // the section id, also inject the basic settings form as the first section
            const { sections: sectionList, question_data: questionList } = userFormData;
            setRenderedFormData([
                {
                    ...basicSettingsSectionJSON,
                    form: (<BasicSettingsForm
                        sectionList={sectionList}
                        userData={userData.user}
                        formHook={basicSettingForm}
                        tabSwitch={tabSwitch}
                    />),
                    isComplete: checkBasicSettingsFormCompletion(userData.user)
                },
                ...sectionList.map((section) => {
                    const jsonQuestionArray = questionList.filter((question) => question.section === section.id);
                    const userProfileValues = initialUserProfileData?.data?.data || {};
                    if (!currentFormSectionContext?.renderedSections) {
                        setCurrentFormSectionContext({
                            ...currentFormSectionContext,
                            renderedSections: userFormData.sections,
                            current: "SETTINGS"
                        });
                    }
                    return {
                        form: (
                            <RenderChanForm key={section.id} userData={userData.user}
                                title={section.name} description={section.description}
                                jsonData={{ data: jsonQuestionArray }} form={form}
                            />
                        ),
                        title: section.name,
                        description: section.description,
                        id: section.id,
                        // Check if the section is complete by iterating over mandatory questions and seeing if they
                        // have a user answer
                        isComplete: jsonQuestionArray.every(item => item.isRequired
                            ? (item.renderingType === 'dynamic')
                                // If the question is dynamic, and the user selected the dependant question option,
                                // then the parent question and sub question values must be set otherwise we can ignore that question
                                ? (userProfileValues[item.parent_question_id] && userProfileValues[item.parent_question_id] === item.parent_option_choice)
                                    ? (userProfileValues[item.parent_question_id] !== null && userProfileValues[item.parent_question_id] !== undefined && userProfileValues[item.id] !== null && userProfileValues[item.id] !== undefined)
                                    : true
                                : (userProfileValues[item.id] !== null && userProfileValues[item.id] !== undefined)
                            : true
                        )
                    };
                })]
            );
        }
    }, [userFormData, userData, setRenderedFormData, initialUserProfileData]);

    if (isLoadingFormData || !initialUserProfileData) {
        return (<EngageSpinner loaderText={'Loading User Profile Forms'} />);
    }

    if (!userData) {
        return (<div>Could not load user data...</div>);
    }

    if (!currentFormSectionContext.renderedSections) {
        return (
            <EngageSpinner loaderText={'Rendering User Profile Forms'} />
        );
    }

    const renderedMenuItems = renderedFormData.map(({ title, id, isComplete }) => ({
        key: id,
        icon: (isComplete || userProfileCompletionStatus[id])
            ? <CheckCircleOutlined style={{ color: Colours.SUCCESS }} />
            : <ExclamationCircleOutlined style={{ color: Colours.DANGER }} />,
        label: title,
    }));
    // after rendering the menu items and the section data return the JSX for the rendered sections and menu
    return (
        <div className={'modify-user-profile-screen'} style={{ backgroundColor: "#F0F2F5" }}>
            <Layout style={{ padding: 0 }}>
                {userAlert}
                <Row>
                    <Col span={24}>
                        <Menu
                            defaultSelectedKeys={currentFormSectionContext.current}
                            selectedKeys={currentFormSectionContext.current}
                            mode="horizontal"
                            items={renderedMenuItems}
                            onClick={handleMenuClick}
                        />
                    </Col>
                </Row>
                <Layout>
                    <Content style={{ width: "80%", margin: "1em 2em" }}>
                        {displayedSection}
                    </Content>
                </Layout>
            </Layout>
        </div>
    );
}

function BasicSettingsForm({ sectionList, userData, formHook, tabSwitch }) {
    const { setCurrentFormSectionContext, currentFormSectionContext } = useContext(CurrentFormSectionContext);
    const { updateUserProfileCompletionStatus } = useContext(UserProfileFormCompletionStatusContext);
    const [displayedForm, setDisplayedForm] = useState(null);

    const nextButtonCallback = useCallback(() => {
        // should only update the section when we click next
        if (!tabSwitch) {
            setCurrentFormSectionContext({
                ...currentFormSectionContext,
                current: sectionList[0].id
            });
            updateUserProfileCompletionStatus({ SETTINGS: true });
        }
    }, [sectionList, setCurrentFormSectionContext]);

    useEffect(() => {
        if (userData) {
            const initialData = getBasicSettingsUserData(userData);
            setDisplayedForm((
                <RegisterUserForm isEditing={true}
                    initialUserData={initialData}
                    description={basicSettingsSectionJSON.description}
                    nextButtonCallback={nextButtonCallback}
                    formHook={formHook}
                />
            ));
        }
    }, [setDisplayedForm, userData]);

    return (
        <div className={"basic-user-settings-form"}>
            {displayedForm}
        </div>
    );
}
