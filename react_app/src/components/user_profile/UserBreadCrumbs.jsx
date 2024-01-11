import React from "react";
import { Breadcrumb } from "antd";
import { renderLinkBreadCrumbItem } from "../utils/common";

export const BreadcrumbTypes = {
    BASE: "BASE",
    PROFILE: "PROFILE",
    FORM: "FORM",
};

export default function UserBreadCrumbs(
    {
        type = BreadcrumbTypes.BASE,
        userData,
        color = "#000000"
    }
) {
    // If the type is PROJECT we will only show the link for the current project page
    // If the type is TASK, and we were supplied task data, we can show the link for the task
    // If the type is FORM, and we have research project data supplied, we can show a link back to the project
    // If we do not have any research project data, do not return anything
    if (!userData && type !== BreadcrumbTypes.BASE) {
        return null;
    }

    let items;
    items = [
        {
            key: '1',
            label: "Community",
            webLink: `/community/`,
            color
        }
    ];

    // now if we are a profile or a form add the second breadcrumb for the user profile shown and their name
    if (type === BreadcrumbTypes.FORM || type === BreadcrumbTypes.PROFILE) {
        const {
            id: userID,
            full_name: fullName,
            user_id: userIDAlt,
            first_name: firstName,
            last_name: lastName
        } = userData;

        items.push({
            key: '2',
            label: (fullName) ? fullName : `${firstName} ${lastName}`,
            webLink: `/app/user/${(userID) ? userID : userIDAlt}/`,
            color
        });
    }

    // Now for the third link in the breadcrumb, check if we are a form
    if (type === BreadcrumbTypes.FORM) {
        items.push({ key: '3', label: 'Edit User Profile', href: '/edit_profile/', color });
    }

    return (
        <Breadcrumb
            className={'user-profile-breadcrumbs'}
            separator={<span style={{ color }}>{"/"}</span>}
            style={{ marginBottom: '0.5em', color }}
            routes={items}
            itemRender={renderLinkBreadCrumbItem}
        />
    );
}
