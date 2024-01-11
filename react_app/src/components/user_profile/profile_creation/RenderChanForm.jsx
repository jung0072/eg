import React, { useContext, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Typography } from "antd";
import { RenderChan } from "render-chan";
import "./edi.css";
import { HandleFormRouting } from "../../utils/";
import { useSaveUserProfileMutation } from '../../../redux/services/userAPI';
import { CurrentFormSectionContext } from "../../../providers/CurrentFormSectionContextProvider.jsx";
import { renderFormErrors, openNotification } from "../../utils/";
import { CheckCircleOutlined } from "@ant-design/icons";
import { Constants } from '../../utils';
import { useSelector } from "react-redux";
import { selectLoggedInUserFormValues } from "../../../redux/services/userAPI";
import {
    UserProfileFormCompletionStatusContext
} from "../../../providers/UserProfileFormCompletionStatusContextProvider";
import { filterQuestionBasedOnUserRole, getQuestionLabelFromUserRole } from "../../utils/common";

const { HumanizedUserRoles } = Constants;
const { Paragraph } = Typography;

// buttonCallbacks is an object that contains: {handleBackCallback, handleNextCallback, handleCancelCallback
export default function RenderChanForm({ userData, jsonData, title, description, form }) {
    const navigate = useNavigate();
    const [submitUserProfileForm, { isSuccess, isLoading }] = useSaveUserProfileMutation();
    const [formErrors, setFormErrors] = useState(null);
    const { currentFormSectionContext, setCurrentFormSectionContext } = useContext(CurrentFormSectionContext);
    const initialUserProfileData = useSelector(selectLoggedInUserFormValues);
    const { updateUserProfileCompletionStatus } = useContext(UserProfileFormCompletionStatusContext);
    // create the callback functions to handle the forms submit, cancel and back button
    const formButtonCallbacks = {
        handleBackCallback: () => {
            // if we are going back, we didn't switch the tab set the state to false
            localStorage.setItem("tabSwitch", "False");
            // get the id of the current section, if there is a previous section go back to the section
            const { renderedSections } = currentFormSectionContext;
            const currentIndex = renderedSections.findIndex(
                section => section.id === currentFormSectionContext.current
            );
            if (currentIndex - 1 >= 0) {
                setCurrentFormSectionContext({
                    ...currentFormSectionContext,
                    current: renderedSections[currentIndex - 1].id
                });
            }
        },
        handleNextCallback: () => {
            // if the user click next, we didn't switched the tab set the state to false
            localStorage.setItem("tabSwitch", "False");
            form.submit();
        },
        handleCancelCallback: () => {
            // go back to the profile details page (or home?)
            useNavigate(`/app/user/${userData.id}`);
        },
    };

    const setFieldsValue = useCallback(
        (initialUserProfileData) => {
            let profileData = initialUserProfileData.data.data;
            if (profileData) {
                form.setFieldsValue(
                    { ...profileData }
                );
            }
        },
        [initialUserProfileData, jsonData]
    );

    useEffect(() => {
        setFieldsValue(initialUserProfileData);
    }, [initialUserProfileData, jsonData]);

    const onFinish = async (values) => {
        // get the id of the current section, if there is a next section go to the next section otherwise
        // navigate back to the profile details page
        const { renderedSections } = currentFormSectionContext;
        const currentIndex = renderedSections.findIndex(
            section => section.id === currentFormSectionContext.current
        );
        // if the user is a researcher they must submit their profile for review once complete
        if (userData.role === HumanizedUserRoles.RESEARCHER || userData.role === HumanizedUserRoles.CLINICIAN) {
            // if the user is at the end of the sections, submit their profile for review
            if (currentIndex + 1 >= renderedSections.length) {
                values.submit_for_review = true;
            }
        }
        // submit the userprofile, and based on teh returned data we can navigate the user to the form or show errors
        submitUserProfileForm(values).then(({ data }) => {
            const {
                success,
                error
            } = data;
            if (success) {
                updateUserProfileCompletionStatus({ [renderedSections[currentIndex].id]: true });
                if (currentIndex + 1 >= renderedSections.length) {
                    openNotification({
                        message: "Updated User Profile",
                        description: `You have successfully updated your user profile features and submitted it for review. We will automatically navigate you to your user profile in a few seconds.`,
                        placement: 'topRight',
                        icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                        timeout: 3000,
                        callback: () => navigate(`/app/user/${userData.id}`)
                    });
                } else {
                    const tabSwitched = localStorage.getItem("tabSwitch");
                    let updatedSectionTitle = renderedSections[currentIndex]?.name || renderedSections[currentIndex]?.title;
                    if (tabSwitched === "True") {
                        const previousIndex = renderedSections.findIndex(
                            section => section.id === currentFormSectionContext.previousSection
                        );
                        updatedSectionTitle = renderedSections[previousIndex]?.name || renderedSections[previousIndex]?.title;
                    }

                    openNotification({
                        message: "Updated User Profile",
                        description: `You have successfully updated the ${updatedSectionTitle} details.`,
                        placement: 'topRight',
                        icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                        timeout: 0,
                        callback: () => {
                            // to avoid going to the next section when tab is switched. If tab is not switched then go to the 
                            // next section
                            if (tabSwitched === "False") {
                                setCurrentFormSectionContext({
                                    ...currentFormSectionContext,
                                    current: renderedSections[currentIndex + 1].id
                                });
                                window.scrollTo(0, 0);
                            }
                        }
                    });
                }
            } else if (error) {
                renderFormErrors(error, setFormErrors, "Error Saving User Profile");
            }
        }).catch(console.error);
    };

    const formProperties = {
        form: form,
        useDefaultFormSubmit: false,
        useFormListErrors: false,
        onFinish: onFinish,
        filterQuestionBasedOnUserRole: filterQuestionBasedOnUserRole,
        getQuestionLabelFromUserRole: getQuestionLabelFromUserRole,
    }

    return (
        <div className={'render-chan-form-node'}>
            <h1 className="form-title">{title}</h1>
            <Paragraph ellipsis={{
                rows: 2,
                expandable: true,
                symbol: 'more',
            }}
            >
                {description}
            </Paragraph>
            <RenderChan jsonType={jsonData} currentProfileType={userData.role} formProperties={formProperties} />
            <HandleFormRouting
                form={form} {...formButtonCallbacks}
                hideBackButton={(currentFormSectionContext.current === "SETTINGS")}
                loadingState={isLoading}
            />
        </div>
    );
}
