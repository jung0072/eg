import React from "react";
import {
    faBookOpenReader,
    faBriefcase,
    faBullhorn,
    faDiagramProject,
    faDroplet,
    faFileWaveform,
    faGear,
    faPhoneVolume,
    faToolbox,
    faUsers,
    faUserTie,
    faProjectDiagram
} from "@fortawesome/free-solid-svg-icons";
import { ReadyState } from "react-use-websocket";

export const MENU_ROUTES = [
    { key: "0", path: "/admin-panel/" },
    { key: "1", path: "/home/" },
    { key: "2", path: "/community/" },
    { key: "3", path: "/projects/" },
    { key: "4", path: "/message_centre/" },
    { key: "5", path: "/about_us/" },
    { key: "6", path: "/app/contact_us/system_issue/" },
    { key: "7", path: "/app/engage_reports/" },
];

export const USER_ROLES = {
    PATIENT: "PATIENT",
    FAMILY_OF_PATIENT: "FAMILY_OF_PATIENT",
    CARETAKER: "CARETAKER",
    RESEARCHER: "RESEARCHER",
    CLINICIAN: "CLINICIAN",
    PASSIVE: "PASSIVE"
};

export const FAQ_TAB_OPTIONS = [
    {
        label: "General",
        type: "GENERAL"
    },
    {
        label: "Account Settings",
        type: "ACCOUNT"
    }
];

export const BackgroundTasksName = {
    BACKGROUND_TASK_UNREAD_NOTIFICATIONS: "Unread Notifications Background Task Duration",
    PERIODIC_EMAILS_ENABLED:  "Are Periodic Background Emails Enabled",
    PERIODIC_EMAILS_STARTS: "Periodic Emails Repetition"
}

export const BackgroundTaskDurations = {
    NEVER: "0",
    DAILY: "86400",
    WEEKLY: "604800",
    BIWEEKLY: "1209600",
    MONTHLY: "2419200",
    YEARLY: "29030400"
}

export const ResearchProjectTypes = {
    EDUCATION: "Education",
    GUIDELINE_DEVELOPMENT: "Guideline Development",
    PATIENT_SAFETY: "Patient Safety",
    QUALITY_IMPROVEMENT: "Quality Improvement",
    RESEARCH_STUDY: "Research Study",
    OTHER: "Other"
};

export const ResearchProjectStudyFormats = {
    PROSPECTIVE_OBSERVATIONAL: "Prospective Observational",
    RCT: "RCT",
    RETROSPECTIVE_OBSERVATIONAL: "Retrospective Observational",
    SYSTEMATIC_REVIEW: "Scoping / Systematic Review",
    SURVEY: "Survey",
    OTHER: "Other"
};

export const HumanizedUserRoles = {
    PATIENT: "Patient Partners",
    FAMILY_OF_PATIENT: "Family of Patient",
    CARETAKER: "Caretaker of Patient",
    RESEARCHER: "Researcher",
    PASSIVE: "Passive",
    CLINICIAN: "Clinician"
};

export const COPYRIGHT = "2023 Engage. All rights reserved.";

export const FOOTER_ITEMS = [
    {
        key: "0",
        label: "Terms & Condition",
        link: "/tos/",
    },
    {
        key: "1",
        label: "Privacy Policy",
        link: "/privacy_policy/",
    },
    {
        key: "2",
        label: "Notification Settings",
        link: "/notification_settings/",
    },
    {
        key: "3",
        label: "FAQ",
        link: "/faq_list/",
    },
    {
        key: "4",
        label: "Contact Us",
        link: "/contact_us/",
    },
    {
        key: "5",
        label: "Blogs & News",
        link: "/system_message/",
    }
];

export const LOGOUT = "Logout";

export const REMINDER_TYPES_ICONS = {
    MEETING: {
        label: 'Work meeting',
        icon: faBriefcase,
    },
    NEW_PROJECT: {
        label: 'New Project',
        icon: faProjectDiagram,
    },
    ANNOUNCEMENT: {
        label: 'Announcement',
        icon: faBullhorn,
    },
    CALL: {
        label: 'Call',
        icon: faPhoneVolume,
    },
};

export const CALENDAR_MODES = {
    MONTH: 'month',
    YEAR: 'year',
};

export const MINIMUM_REQ_SUBTITLE = "Please fill out all required information to continue accessing this page. Click 'I Understand' or you will be redirected automatically to the user profile settings page.";

export const MINIMUM_REQ_TITLE = 'Minimum Requirements Not Met';

export const ADMIN_PANEL_COMPONENT = [
    {
        id: 1,
        icon: faDiagramProject,
        value: 0,
        title: 'Pending Projects',
        description: 'Approve/Deny Projects',
    },
    {
        id: 2,
        icon: faBookOpenReader,
        value: 0,
        title: 'Pending Researchers',
        description: 'Approve/Deny Researchers',
    },
    {
        id: 3,
        icon: faToolbox,
        value: 0,
        title: 'Project Management',
        description: 'Manage active projects',
    },
    {
        id: 4,
        icon: faUsers,
        value: 0,
        title: 'User Management',
        description: 'Manage active users',
    },
    {
        id: 5,
        icon: faBullhorn,
        value: 0,
        title: 'System Messages',
        description: 'Alert the user of the systems',
    },
    {
        id: 6,
        icon: faUserTie,
        value: 'GO',
        title: 'Customize User Profile Questions',
        description: 'Create and Edit User Profile Questions',
    },
    {
        id: 7,
        icon: faFileWaveform,
        value: 'GO',
        title: 'Customize Research Project Questions',
        description: 'Create and Edit Research Project Questions',
    },
    {
        id: 8,
        icon: faFileWaveform,
        value: 'GO',
        title: 'Customize User Profile Inventory Answers',
        description: 'Create and Edit Research Interests',
    },
    {
        id: 9,
        icon: faGear,
        value: 'GO',
        title: 'System Settings',
        description: 'Edit global system settings',
    },
];

export const USER_PROFILE_ROUTE = '/app/user/';

export const PROJECT_DETAILS_ROUTE = '/app/research_study/';

export const TASK_ROLES = [
    { value: 'PATIENT', label: 'Patient Partners' },
    { value: 'FAMILY_OF_PATIENT', label: 'Family of Patient' },
    { value: 'CARETAKER', label: 'Caretaker of Patient' },
    { value: 'RESEARCHER', label: 'Researcher' },
    { value: 'CLINICIAN', label: 'Clinician' },
];

export const ENQUIRY_OPTIONS = [
    {
        value: 'ITS',
        label: 'IT Support',
    },
    {
        value: 'PRJ',
        label: 'Regarding Project',
    },
    {
        value: 'MSG',
        label: 'Message Centre',
    },
    {
        value: 'PRI',
        label: 'Privacy Concern',
    },
    {
        value: 'SGI',
        label: 'Suggest Improvement',
    },
    {
        value: 'OTH',
        label: 'Other',
    },
];

export const EDI_DATE_PICKER_FORMAT = "YYYY-MM-DD";

export const ACC_SUCCESSFULLY_CREATED_DESC = "Congratulations! Your new account has been successfully created! A confirmation email has been sent to the provided email address. Please note that the confirmation email may have been automatically filtered into your junk mail folder. If you have not received it within the 24 hours, please contact us. Sign in to start using Engage.";

export const ACC_SUCCESSFULLY_CREATED_INSIGHTSCOPE = `
Congratulations! Your new account has been successfully created using insightScope credentials! 
A confirmation email has been sent to the provided email address. 
Please note that the confirmation email may have been automatically filtered into your junk mail folder. 
If you have not received it within the 24 hours, please contact us. 
You can start using engage using your insightScope credentials.`;

export const ACCOUNT_ACTIVATED_SUCCESSFULLY_DESC = (<p>Congratulations! Your account has been successfully activated.
                                                       You can now log in, Thank you for joining us! If you have any
                                                       questions or need any help getting started, please
                                                       don't hesitate to
                                                       contact our support team at <a
        href={`mailto: ${process.env.DEFAULT_FROM_EMAIL}`}>{process.env.DEFAULT_FROM_EMAIL}</a>.</p>);

export const ACTIVATE_ACCOUNT_DESCRIPTION = (
    <p>To access Engage and join the Researchers and Patients across Canada. Click Below</p>
);
export const ProjectRecruitingStatus = {
    OPEN: {
        label: "Open",
        type: "success",
        colour: '#1AB759',
    },
    CLOSED: {
        label: "Closed",
        type: "Warning",
        colour: '#FF0000',
    }
};

export const acceptedResearchTaskFileTypes = [
    'xls', 'xlsx', 'doc', 'docx', 'csv', 'txt', 'pdf', 'ris', 'ppt', 'pptx'
];

// The list types used for the community list, Card view will show users in cards while details view will show
// users in a table
export const LIST_TYPES = {
    CARD: 'Card View',
    DETAIL: 'Details View'
};

// screens for contact us forms
export const SCREENS = [
    {
        value: 'HOME',
        label: 'Home page',
        route: /\/home\//
    },
    {
        value: 'COMMUNITY',
        label: 'Community page',
        route: /\/community\//
    },
    {
        value: 'USER_PROFILE_DETAILS',
        label: 'User profile details',
        route: /^\/app\/user\/(\d+)$/
    },
    {
        value: 'CUSTOMIZE_USER_PROFILE_FORMS',
        label: 'Customize User Profile Forms',
        route: /\/edit_profile\//
    },
    {
        value: 'PROJECT_LIST',
        label: 'Project List page',
        route: /\/projects\//
    },
    {
        value: 'PROJECT_DETAILS',
        label: 'Project details page',
        route: /^\/app\/research_study\/(\d+)$/
    },
    {
        value: 'CREATE_PROJECT',
        label: 'Create Project page',
        route: /^\/app\/research_study_form\/$/
    },
    {
        value: 'EDIT_PROJECT',
        label: 'EDIT Project page',
        route: /^\/app\/research_study_form\/(\d+)$/
    },
    {
        value: 'RESEARCH_TASK_DETAIL',
        label: 'Research task details page',
        route: /^\/app\/research_task\/(\d+)$/
    },
    {
        value: 'MESSAGE_CENTRE',
        label: 'Message Centre',
        route: /\/message_centre\//
    },
    {
        value: 'CONTACT_US',
        label: 'Contact Us Form',
        route: /^\/app\/contact_us\/$/
    },
    {
        value: 'SYSTEM_ISSUES',
        label: 'System Issues',
        route: /^\/app\/contact_us\/system_issue\/$/
    },
    {
        value: 'FAQ',
        label: 'FAQ’s',
        route: /^\/app\/faq_list\/(\d+)$/
    },
    {
        value: 'LOGIN',
        label: 'Login',
        route: /\/$/
    },
    {
        value: 'SIGNUP',
        label: 'Signup',
        route: /\/registration\//
    },
];

// date types for the project and task creation
export const DATE_TYPES = {
    // formatting as per canadian date format
    MONTH_YEAR: { key: 'MONTH_YEAR', label: 'Month / Year', picker: 'month', format: 'YYYY-MMM' },
    YEAR: { key: 'YEAR', label: 'Year', picker: 'year', format: 'YYYY' },
    DAY_MONTH: { key: 'DAY_MONTH', label: 'Day / Month', picker: 'day', format: 'MMM-DD' },
    EXACT_DATE: { key: 'EXACT_DATE', label: 'Exact Date and Time', picker: 'day', format: 'YYYY-MM-DD HH:mm:ss', showTime: {format: "h:mm a", use12Hours: true} },
};

// webSocket connection statues using the react-use-websocket npm pkg
export const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
};

// function to get the current connect status of a websocket based on its ready state
export const getConnectionStatus = (readyState) => connectionStatus[readyState];

export const ContactLogActionTypes = {
    PENDING: "Pending / Not Started",
    DISCUSSION: "Discussion Required",
    ASSIGNED: "Assigned",
    DESIGN: "In Design",
    DEV: "In Development",
    CODE: "Code Review",
    REVIEW: "Review Ready",
    COMPLETE: "Completed",
};

export const ContactLogPriorityTypes = {
    NOT: "Not Assigned",
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    SEVERE: "Severe",
};

export const EngageReportTypes = {
    PROJECT: "Project",
    TASK: "Task",
    MESSAGE: "Message",
    USER: "User",
    FILE: "File",
}

export const questionTypes = [
    { value: "TEXT_BODY", label: "Text Input", isAllowedResearchInterest: false },
    { value: "CHECKBOX", label: "Checkbox", isAllowedResearchInterest: false },
    { value: "DATE_PICKER", label: "Date Picker", isAllowedResearchInterest: false },
    { value: "DATE_PICKER_YEAR", label: "Date Picker Year", isAllowedResearchInterest: false },
    { value: "RADIO_BUTTON_BOX", label: "Radio Button Box", isAllowedResearchInterest: true },
    { value: "RADIO_BUTTON_CIRCLE", label: "Radio Button Circle", isAllowedResearchInterest: true },
    { value: "DROP_DOWN", label: "Drop Down", isAllowedResearchInterest: true },
    { value: "TEXT_AREA", label: "Text Area", isAllowedResearchInterest: false },
    { value: "INPUT_TYPE", label: "Input Type", isAllowedResearchInterest: false },
    { value: "UPLOAD_PICTURE", label: "Upload Picture", isAllowedResearchInterest: false },
    { value: "CHECKBOX_FOR_LANGUAGE", label: "Checkbox for Language", isAllowedResearchInterest: false },
    { value: "SELECT_MULTIPLE", label: "Select Multiple", isAllowedResearchInterest: true },
    { value: "TREE_SELECT", label: "Tree Select", isAllowedResearchInterest: true },
    { value: "SELECT_MULTIPLE_BOX", label: "Select Multiple Box", isAllowedResearchInterest: true },
    { value: "WEB_LINK", label: "Web Link", isAllowedResearchInterest: false },
];
