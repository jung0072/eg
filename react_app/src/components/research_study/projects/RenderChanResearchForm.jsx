import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Row, Typography } from "antd";
import "../../user_profile/profile_creation/edi.css";
import { RenderChan } from "render-chan";
import { openNotification, renderFormErrors } from "../../utils/";
import { CheckCircleOutlined } from "@ant-design/icons";
import { filterQuestionBasedOnUserRole, getQuestionLabelFromUserRole } from "../../utils/common";

const { Title } = Typography;

// buttonCallbacks is an object that contains: {handleBackCallback, handleNextCallback, handleCancelCallback}
export default function RenderChanResearchForm(
    {
        userData,
        jsonData,
        title,
        mutationTrigger,
        isLoadingMutation,
        description,
        researchProjectID = null,
        initialFormData
    }
) {
    const [formErrors, setFormErrors] = useState([]);
    const [form] = Form.useForm();

    // callback hook to set the form values
    const setFieldsValue = useCallback((initialResearchProjectData) => {
        if (initialResearchProjectData) {
            form.setFieldsValue(
                { ...initialResearchProjectData }
            );
        }
    },
        [initialFormData]
    );

    const onFinish = useCallback((values) => {
        // submit the userprofile, and based on teh returned data we can navigate the user to the form or show errors
        mutationTrigger({ demographics_form: values, id: researchProjectID }).then(({ data }) => {
            const {
                success,
                error
            } = data;
            if (success) {
                openNotification({
                    message: "Updated Research Project",
                    description: `You have successfully updated Research Study details.`,
                    placement: 'topRight',
                    icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                });
            } else if (error) {
                setFormErrors(error);
                renderFormErrors(error, setFormErrors, "Error Saving Research Project");
            }
        }).catch(console.error);
    }, [mutationTrigger, setFormErrors, researchProjectID]);

    // useEffect hook to reload the form values when the initialFormData changes
    useEffect(() => {
        if (initialFormData) {
            setFieldsValue(initialFormData);
        }
    }, [initialFormData]);

    const formProperties = {
        form: form,
        formName: (title) ? title.replace(" ", "_").lowerCase() : '',
        formErrors: formErrors,
        formSubmitText: "Submit",
        isLoadingMutation: isLoadingMutation,
        useDefaultFormSubmit: true,
        useFormListErrors: true,
        onFinish: onFinish,
        filterQuestionBasedOnUserRole: filterQuestionBasedOnUserRole,
        getQuestionLabelFromUserRole: getQuestionLabelFromUserRole,
    }

    return (
        <div className={'render-chan-form-node'}>
            <Title level={3} className="form-title">{title}</Title>
            <RenderChan jsonType={jsonData} currentProfileType={userData.role} formProperties={formProperties} />
        </div>
    );
}
