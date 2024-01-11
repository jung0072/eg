import React from "react";
import { Breadcrumb } from "antd";
import { renderLinkBreadCrumbItem } from "../../utils/common";

export const BreadcrumbTypes = {
    TASK: "TASK",
    PROJECT: "PROJECT",
    FORM: "FORM",
};

export default function ResearchProjectBreadcrumbs(
    {
        type = BreadcrumbTypes.PROJECT,
        researchProjectData,
        researchTaskData = null
    }
) {
    // If the type is PROJECT we will only show the link for the current project page
    // If the type is TASK and we were supplied task data, we can show the link for the task
    // If the type is FORM and we have research project data supplied, we can show a link back to the project
    // If we do not have any research project data, do not return anything
    if (!researchProjectData && !researchTaskData) {
        return null;
    }
    const projectID = (researchProjectData) ? researchProjectData.id : researchTaskData.research_project_id;
    const projectTitle = (researchProjectData) ? researchProjectData.reference_name : researchTaskData.research_project_title;

    let items;
    items = [
        {
            key: '0',
            label: 'Projects',
            webLink: '/projects/'
        },
        {
            key: '1',
            label: projectTitle,
            webLink: `/app/research_study/${projectID}/`
        }
    ];

    // Now for the second link in the breadcrumb, check if we are a form, or if this is a task / task form with task data
    if (type === BreadcrumbTypes.FORM) {
        items.push({ key: '2', label: 'Edit Research Project Form' });
    } else if (type === BreadcrumbTypes.TASK && researchTaskData) {
        items.push({
            key: '2',
            label: researchTaskData.title,
            webLink: `/app/research_task/${researchTaskData.id}`
        });
    }

    return (
        <Breadcrumb
            itemRender={renderLinkBreadCrumbItem}
            separator={"/"}
            style={{ marginBottom: '0.5em' }}
            routes={items}
        />
    );
}
