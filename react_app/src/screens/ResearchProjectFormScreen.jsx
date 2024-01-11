import React, { useContext, useEffect, useState } from 'react';
import CollapsableResearchProjectForm from "../components/research_study/projects/CollapsableResearchProjectForm";
import {
    useCreateProjectMutation,
    useResearchProjectFormDataQuery,
    useResearchProjectInfoQuery
} from "../redux/services/researchProjectAPI";
import RenderChanResearchForm from '../components/research_study/projects/RenderChanResearchForm';
import { Constants, EngageSpinner, useQuery } from "../components/utils";
import { useParams } from "react-router-dom";
import { CreateResearchProjectForm } from "../components/research_study";
import { Form, Tabs } from "antd";
import ResearchProjectBreadcrumbs from "../components/research_study/projects/ResearchProjectBreadcrumbs";
import { useEngageStylingLayout } from '../providers/EngageLayoutStylingContextProvider';
import SubmitProjectForReviewForm from "../components/research_study/projects/SubmitProjectForReviewForm";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { MENU_ROUTES } from "../components/utils/constants";

const { HumanizedUserRoles } = Constants;

export default function ResearchProjectFormScreen({}) {
    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);

    // Request the data of the research project answers to reload form values
    const { data: researchProjectFormData, isSuccess, isLoading } = useResearchProjectFormDataQuery();
    const [submitResearchProjectForm, { isLoading: isLoadingSubmitResearchProject }] = useCreateProjectMutation();
    const { id: researchProjectID } = useParams();
    const { data: researchProjectData } = (researchProjectID)
        ? useResearchProjectInfoQuery(researchProjectID)
        : { data: { id: null } };
    const [renderedProjectFormData, setRenderedProjectFormData] = useState([]);

    // Check if we have query params to open up to a specific tab in the create project form
    const queryParams = useQuery();
    const defaultActiveTab = queryParams.get('showTeamDemographics')
        ? "2"
        : "1";

    // useEffect hook to handle the component did mount life cycle event
    useEffect(() => {
        // scroll to the top of the page when this component mounts
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // remove the padding
        removeLayoutPadding(false);
        // remove the white background color
        changeBackgroundColor(false);
        // set the active nav menu to the research projects page
        updateActiveNavigationMenu(MENU_ROUTES[3].key);
    }, []);

    // useEffect hook to set the rendered project data if we have it
    useEffect(() => {
        if (researchProjectFormData && isSuccess && researchProjectID) {
            // once we have the data, map over the sections list and build the question json from questions that match
            // the section id
            const { sections: sectionList, question_data: questionList } = researchProjectFormData.data;
            setRenderedProjectFormData(sectionList.map((section) => {
                const jsonQuestionArray = questionList.filter((question) => question.section === section.id);
                const initialFormData = (researchProjectData)
                    ? Object.fromEntries(
                        researchProjectData?.custom_answers.map(answer => [answer.question_id, answer.selected_options])
                    )
                    : null;
                let hasFormData = false;
                if (initialFormData) {
                    for (const [key, value] of Object.entries(initialFormData)) {
                        if (value && jsonQuestionArray.some(question => question.id === key)) {
                            hasFormData = true;
                        }
                    }
                }
                return {
                    form: (
                        <RenderChanResearchForm
                            researchProjectID={researchProjectID}
                            jsonData={{ data: jsonQuestionArray }}
                            title={section.title} description={section.description}
                            userData={{ role: HumanizedUserRoles.RESEARCHER }}
                            initialFormData={initialFormData}
                            isLoadingMutation={isLoadingSubmitResearchProject}
                            mutationTrigger={submitResearchProjectForm}
                        />
                    ),
                    title: section.name,
                    description: section.description,
                    hasDefaultData: hasFormData
                };
            }));
        }
    }, [researchProjectFormData, setRenderedProjectFormData, researchProjectData, isSuccess]);

    if (isLoading || !researchProjectFormData) {
        return (<EngageSpinner display={"fullscreen"} />);
    }

    const tabItems = [
        {
            key: '1',
            label: "Project Details",
            children: (
                <CreateResearchProjectForm
                    researchProjectData={researchProjectData}
                    isLoadingMutation={isLoadingSubmitResearchProject}
                    mutationTrigger={submitResearchProjectForm}
                />
            )
        },
        (researchProjectID)
            ? {
                key: '2',
                label: "Team Demographics",
                children: (
                    <CollapsableResearchProjectForm
                        researchProjectData={researchProjectData}
                        formItemArray={renderedProjectFormData}
                        researchProjectID={researchProjectID}
                        isLoadingMutation={isLoadingSubmitResearchProject}
                        mutationTrigger={submitResearchProjectForm}
                    />
                )
            }
            : null,
        (researchProjectID)
            ? {
                key: '3',
                label: "Submit for Admin Approval",
                children: (
                    <SubmitProjectForReviewForm
                        researchProjectData={researchProjectData}
                        mutationTrigger={submitResearchProjectForm}
                    />
                )
            }
            : null
    ];

    // now return a collapsable research project with each render chan form instance in a different panel
    return (
        <Form.Provider
            onFormFinish={(name, formInfo, form) => {
                console.log(name, formInfo, document.forms);
            }}
        >
            {(researchProjectID) ?
                <ResearchProjectBreadcrumbs researchProjectData={researchProjectData} type={"FORM"} />
                : null
            }
            <Tabs defaultActiveKey={defaultActiveTab} items={tabItems} style={{ width: '70vw' }} />
        </Form.Provider>
    );
}
