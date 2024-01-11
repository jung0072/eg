import { Breadcrumb, notification } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import moment from 'moment';
import { Colours, Constants } from ".";
import { HumanizedUserRoles } from "./constants";
import html2canvas from "html2canvas";

export function createTitleFromText(inputString) {
    return `${inputString.charAt(0).toLocaleUpperCase()}${inputString.substr(1).toLocaleLowerCase()}`.replaceAll(
        '_', ' '
    );
}



export const weekdays = [
    {"label": "Monday", "value": '1'},
    {"label": "Tuesday", "value": '2'},
    {"label": "Wednesday", "value": '3'},
    {"label": "Thursday", "value": '4'},
    {"label": "Friday", "value": '5'},
    {"label": "Saturday", "value": '6'},
    {"label": "Sunday", "value": '7'},
]

export const getDays = (month) => {
    let res = []
    if (month === null) {
        month = '2'
    }
    const daysInMonth = {
        '1': 31, '2': 28, '3': 31, '4': 30, '5': 31, '6': 30,
        '7': 31, '8': 31, '9': 30, '10': 31, '11': 30, '12': 31
    };
    for (let i = 1; i <= daysInMonth[month]; i++) {
        res.push({'label': i, value: ''+i})
    }
    return res
}

export const months = [
    {'label': 'January', 'value': '1'},
    {'label': 'February', 'value': '2'},
    {'label': 'March', 'value': '3'},
    {'label': 'April', 'value': '4'},
    {'label': 'May', 'value': '5'},
    {'label': 'June', 'value': '6'},
    {'label': 'July', 'value': '7'},
    {'label': 'August', 'value': '8'},
    {'label': 'September', 'value': '9'},
    {'label': 'October', 'value': '10'},
    {'label': 'November', 'value': '11'},
    {'label': 'December', 'value': '12'}
]
export const NotificationTypes = {
    INFO: 'info',
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning'
};

export function openNotification(
    {
        placement,
        message,
        description,
        icon,
        callback = null,
        timeout = 5000,
        type = NotificationTypes.INFO
    }
) {
    // first create an object of all of the notification params from ant-d then depending on the type display the
    // notification
    const notificationParams = {
        message: message,
        description: description,
        placement,
        icon: icon
    };
    switch (type) {
        case NotificationTypes.INFO:
            notification.info(notificationParams);
            break;
        case NotificationTypes.ERROR:
            notification.error(notificationParams);
            break;
        case NotificationTypes.SUCCESS:
            notification.success(notificationParams);
            break;
        case NotificationTypes.WARNING:
            notification.warning(notificationParams);
            break;
        default:
            console.error("This is not a valid notification type");
            break;
    }

    // if we are supplied a callback function and timeout we can execute the function after X seconds (Defaults 5sec)
    if (callback) {
        setTimeout(callback, timeout);
    }
}

// from ant-d documentation for images:
export const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
};

function getPropertyAndLabel(property, formErrorObject) {
    return `${property.replaceAll("_", " ")}: ${formErrorObject[property].toString()}`;
}

export function renderFormErrors(formError, setterFunction, message = "Error Saving Form", timeout = 5000) {
    // first render the error list by iterating over all the errors and setting them in list-item tags
    // then show the user a notification
    const { data: errorData } = formError;
    const formErrorObject = ("data" in formError)
        ? ("form_errors" in formError.data)
            ? errorData.form_errors
            : ("user" in errorData)
                ? { ...errorData.user, ...errorData.user_profile }
                : errorData
        : [];
    const formErrorList = [];
    for (const property in formErrorObject) {
        formErrorList.push(getPropertyAndLabel(property, formErrorObject));
    }
    const renderedErrorList = formErrorList.map((error, index) => (<li key={`${index}-error`}>{error}</li>));
    if (setterFunction) {
        setterFunction(renderedErrorList);
    }
    openNotification({
        message,
        description: (<ul>{formErrorList}</ul>),
        placement: 'topRight',
        icon: (<ExclamationCircleOutlined style={{ color: '#FF0000' }} />),
        type: NotificationTypes.ERROR,
        timeout: timeout,
    });
    console.error(formError, message);
}

// taken from ant-d design docs
export function getItemAntDMenu(label, key, icon, children, type, disabled = false) {
    return {
        key,
        icon,
        children,
        label,
        type,
        disabled,
    };
}

// from react router dom docs
// A custom hook that builds on useLocation to parse the query string for you.
export function useQuery() {
    const { search } = useLocation();
    return React.useMemo(() => new URLSearchParams(search), [search]);
}

export const mapOptionsToTreeData = (option) => ({
    title: option.title,
    value: option.id,
    key: option.id,
    children: (option?.options?.length > 0) ? option.options.map(mapOptionsToTreeData) : []
});

export const formatMomentDate = (date, dateFormat = "YYYY-MM-DD") => {
    const formattedDate = moment(date);
    formattedDate.format(dateFormat);
    return formattedDate;
};

export const getUserAuthorizationHeaders = () => {
    const headers = new Headers();
    const access = sessionStorage.getItem("access");
    if (access) {
        headers.set("Authorization", `Bearer ${access}`);
    }
    return headers;
};

export const downloadFileBLOB = (fileBlob, fileName) => {
    // Download a file that is returned from the backend using a fetch request, make sure to only send a file blob
    // to this function using response.blob() or new Blob(response)
    const fileLink = document.createElement('a');
    fileLink.href = URL.createObjectURL(fileBlob);
    fileLink.setAttribute('target', '_blank');
    fileLink.setAttribute('download', fileName);
    fileLink.click();
    URL.revokeObjectURL(fileLink.href);
};

export const formatRangePickerMomentDate = (dateArray, format = 'YYYY-MM-DD') => {
    return (dateArray)
        ? [formatMomentDate(dateArray[0]), formatMomentDate(dateArray[1])]
        : ['', ''];
};

export const checkIsValidRangePickerMomentDate = (dateArray) => {
    // iterate over each date in the date array and check if they are a valid moment object and a valid moment date
    // then if every item in the array is true, the date array is valid otherwise we return false
    const isValidDateArray = dateArray.map(momentDate => {
        if (moment.isMoment(momentDate)) {
            return momentDate.isValid();
        }
        return false;
    });

    // Using every with the Boolean constructor will force the check to make sure each item is boolean true in the array
    return isValidDateArray.every(Boolean);
};

export const checkInvalidDate = (_, value) => {
    if (value && !value.isValid()) {
        return Promise.reject('Invalid date selected, please select a date');
    }
    return Promise.resolve();
};

export const createBreadcrumbItem = ({ webLink = "#", label, key, color = '#000000' }, index, arrayList) => (
    <React.Fragment key={key}>
        <Breadcrumb.Item style={{ color }} key={key} href={webLink}>{label}</Breadcrumb.Item>
        {(index + 1 !== arrayList.length) ? <Breadcrumb.Separator key={`${key}-sep`} style={{ color }} /> : null}
    </React.Fragment>
);

export const renderLinkBreadCrumbItem = (route, _, routes) => {
    const last = routes.indexOf(route) === routes.length - 1;
    if (last) {
        return <span style={{ color: route.color }}>{route.label}</span>;
    }
    return <Link style={{ color: route.color }} key={route.key} to={route.webLink}>{route.label}</Link>;
};

export const getEstimatedDates = (projectData, showMonthName = false, separatedBy = "/") => {
    const start_date = moment(projectData?.start_date);
    const end_date = moment(projectData?.end_date);
    const formatYearMonthDay = (date, type) => {
        const formatMonth = showMonthName ? 'MMM' : 'MM';
        if (type === Constants.DATE_TYPES.MONTH_YEAR.key) {
            return date.format(`YYYY${separatedBy}${formatMonth}`);
        } else if (type === Constants.DATE_TYPES.DAY_MONTH.key) {
            return date.format(`${formatMonth}${separatedBy}DD`);
        } else if (type === Constants.DATE_TYPES.YEAR.key) {
            return date.format('YYYY');
        } else if (type === Constants.DATE_TYPES.EXACT_DATE.key) {
            return date.format(`YYYY${separatedBy}${formatMonth}${separatedBy}DD - hh:mm A`);
        }
    };

    const estStartDate = formatYearMonthDay(start_date, projectData.start_date_type);

    const estEndDate = formatYearMonthDay(end_date, projectData.end_date_type);
    return { startDate: estStartDate, endDate: estEndDate };
};

export function renderTaskDueDate(taskDueStatus) {
    const dueLists = [
        { name: "Overdue Tasks", color: Colours.DANGER },
        { name: "Task Due Soon", color: Colours.WARNING },
        { name: "Task Overdue", color: Colours.DANGER },
        { name: "Assign Task", color: Colours.SUCCESS },
        { name: "Task Close", color: Colours.GREYED },
        { name: "Unknown", color: Colours.GREYED },
        { name: "Unassigned", color: Colours.GREYED },
        { name: '', color: null }
    ];

    const trueDueDate = dueLists.find((item) => item.name === taskDueStatus);
    if (trueDueDate.name === '') {
        return null;
    }
    return (
        <div className="column-name-due">
            <span style={{ color: trueDueDate.color }}>{trueDueDate.name}</span>&nbsp;
        </div>
    );
}

/**
 * Converts the input text to title case.
 * Title case capitalizes the first letter of each word and makes the rest lowercase.
 *
 * @param {string} baseText - The input text to be converted to title case.
 * @returns {string} The title cased version of the input text.
 *
 * @example
 * const inputText = "hello world";
 * const titleCaseText = convertToTitleCase(inputText);
 * console.log(titleCaseText); // Output: "Hello World"
 */
export const convertToTitleCase = (baseText) => {
    // Capitalize the first letter of each word and make the rest lowercase
    const titleCaseWords = baseText.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    // Join the words back into a single string and return the title cased string
    return titleCaseWords.join(' ');
};


/**
 * Filters the question based on the user's role and the required profile type.
 * @param {object} question - The question object.
 * @returns {boolean} - True if the question should be included, false otherwise.
 */
export function filterQuestionBasedOnUserRole(question) {
    // using destructing get the specific comparison variables required for this filter function
    const {
        role: userRole,
        is_required_researcher: isRequiredResearcher,
        is_required_patient: isRequiredPatient,
        is_required_family_of_patient: isRequiredFamilyOfPatient,
        is_required_passive: isRequiredPassive
    } = question;

    // filter the question based on the user role and what is required by the profile type
    // for now clinician and researchers are treated as the same thing. Same with caretakers of patients and family
    if ((userRole === HumanizedUserRoles.RESEARCHER || userRole === HumanizedUserRoles.CLINICIAN) && isRequiredResearcher) {
        return question;
    } else if ((userRole === HumanizedUserRoles.FAMILY_OF_PATIENT || userRole === HumanizedUserRoles.CARETAKER) && isRequiredFamilyOfPatient) {
        return question;
    } else if (userRole === HumanizedUserRoles.PATIENT && isRequiredPatient) {
        return question;
    } else if (userRole === HumanizedUserRoles.PASSIVE && isRequiredPassive) {
        return question;
    }
}

/**
 * Retrieves the question label based on the user's role.
 * @param {object} userRole - The user's role and the corresponding question labels.
 * @param {string} textForFamilyOfPatient - the text label for users that have the role Family of Patient
 * @param {string} textForCaretakerOfPatient - the text label for users that have the role Caretaker of Patient
 * @param {string} textForPatient - the text label for users that have the role Patient Partner
 * @param {string} textForResearcher - the text label for users that have the role Researcher
 * @param {string} textForPassive - the text label for users that have the role Passive User (not implemented anymore)
 * @returns {string} - The question label.
 */
export function getQuestionLabelFromUserRole(
    {
        role: userRole,
        text_for_family_of_patient: textForFamilyOfPatient,
        text_for_caretaker_of_patient: textForCaretakerOfPatient,
        text_for_patient: textForPatient,
        text_for_researcher: textForResearcher,
        text_for_passive: textForPassive
    }
) {
    switch (userRole) {
        case HumanizedUserRoles.CARETAKER:
            return textForCaretakerOfPatient;
        case HumanizedUserRoles.FAMILY_OF_PATIENT:
            return textForFamilyOfPatient;
        case HumanizedUserRoles.RESEARCHER:
        case HumanizedUserRoles.CLINICIAN:
            return textForResearcher;
        case HumanizedUserRoles.PATIENT:
            return textForPatient;
        case HumanizedUserRoles.PASSIVE:
            return textForPassive;
        default:
            console.error('This user role is not supported, please contact your admin', userRole);
    }
}

/**
 * Compare two Django datetime strings and return the difference in milliseconds.
 *
 * @param {Object} a - The first object containing a Django datetime string with timezone.
 * @param {Object} b - The second object containing a Django datetime string with timezone.
 * @returns {number} The difference in milliseconds between the two datetime values.
 *
 * @example
 * const dateA = { join_date: '2023-06-05 18:07:28.786184+00:00' };
 * const dateB = { join_date: '2023-06-05 18:05:10.123456+00:00' };
 * const difference = compareDjangoDates(dateA, dateB);
 * // Returns a positive or negative number indicating the time difference.
 */
export function compareDjangoDates(a, b) {
    const dateA = new Date(a).getTime();
    const dateB = new Date(b).getTime();
    return dateA - dateB;
}

/**
 * Username based on the role
 * @param {Object} user - User object
 * @returns the full name based on the user role
 */
export function nameBasedOnUserRole(user) {
    return (user.role === Constants.HumanizedUserRoles.RESEARCHER ||
        user.role === Constants.HumanizedUserRoles.CLINICIAN) ?
        `${user.first_name} ${user.last_name}` :
        `${user.first_name} ${user.last_name.charAt(0)}.`;
}

/**
 * CaptureScreenshot - Captures a screenshot of the current webpage
 *
 * @param {function} screenshotCallback - A callback function to handle the captured screenshot.
 *   The callback will receive the screenshot as a parameter (as an html canvas element).
 * @returns {void}
 */
export function captureScreenshot(screenshotCallback) {
    // first get a reference to the document body and scroll the window to the top to avoid distortion
    const documentElement = document.documentElement;
    window.scrollTo(0, 0);

    // now using html2canvas we can save screenshot of the document body and set our configurations before using the callback
    html2canvas(documentElement, {
        x: 0,
        y: 0,
        width: documentElement.width,
        height: documentElement.height,
        offsetWidth: documentElement.offsetWidth,
        offsetHeight: documentElement.offsetHeight,
        scale: 2,
        inlineImages: true,
        copyStyles: true,
        allowTaint: true,
        useCORS: true,
        taintTest: false,
    }).then(screenshotCallback);
}

/**
 * Retrieves the current date (or the supplied date) and time as a formatted string.
 *
 * This function returns the current date (or supplied date) and time in the following format:
 * "YYYY-MM-DD-HH:MM:SS:SSS", where:
 * - "YYYY" represents the four-digit year.
 * - "MM" represents the two-digit month (01 for January, 12 for December).
 * - "DD" represents the two-digit day of the month.
 * - "HH" represents the two-digit hour in 24-hour format (00 to 23).
 * - "MM" represents the two-digit minute (00 to 59).
 * - "SS" represents the two-digit second (00 to 59).
 * - "SSS" represents the three-digit millisecond (000 to 999).
 *
 * @returns {string} A formatted string representing the current date (or supplied date) and time.
 */
export function getTimeStringFromDate(dateToConvert = new Date()) {
    const year = dateToConvert.getFullYear();
    const month = String(dateToConvert.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(dateToConvert.getDate()).padStart(2, '0');
    const hours = String(dateToConvert.getHours()).padStart(2, '0');
    const minutes = String(dateToConvert.getMinutes()).padStart(2, '0');
    const seconds = String(dateToConvert.getSeconds()).padStart(2, '0');
    const milliseconds = String(dateToConvert.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day}-${hours}:${minutes}:${seconds}:${milliseconds}`;
}

/**
 * Calculates the number of days between two given dates.
 *
 * @param {Date} dateA - The first date.
 * @param {Date} dateB - The second date.
 * @returns {number} - The number of days between the two dates. The result is a whole number (integer).
 */
export function getNumberOfDaysBetweenDates(dateA, dateB) {
    // Calculate the time difference in milliseconds and then convert milliseconds to days
    const timeDifference = dateB - dateA;
    return Math.floor(timeDifference / (1000 * 60 * 60 * 24));
}

/**
 * Check if the associatedWithID matches the given type and itemID.
 * You can use this if you are using actionComponent outside the EngageAction
 *
 * @param {string} associatedWithID - The ID associated with a specific item.
 * @param {string} type - The type to check against (e.g., 'FILE', 'TASK', 'PROJECT', 'USER').
 * @param {number} itemID - The ID of the item to compare with.
 * @returns {boolean} Returns true if associatedWithID matches the specified type and itemID, otherwise false.
 */
export const checkAssociatedWithID = (associatedWithID, type, itemID) => {
    // Convert the type to an integer ID and check against the itemID
    return parseInt(associatedWithID?.replace(new RegExp(`^${type}-`), "")) === parseInt(itemID);
}

/**
     * Generates a CSS positioning object for a triangle element based on a given position.
     *
     * @param {string} position - The desired position (e.g., 'topRight', 'leftBottom').
     * @returns {Object} The CSS positioning properties object.
     */
export function getTrianglePosition(position) {
    // Common properties for different positioning options
    //     case 'topRight':
    //     case 'topLeft':
    //     case 'bottomRight':
    //     case 'bottomLeft':
    //     case 'rightTop':
    //     case 'leftTop':
    //     case 'rightBottom':
    //     case 'leftBottom':
    const commonProp = {
        top: { transform: 'translateY(calc(-100% - 13px))', rotate: 'rotate(0deg)', reverse: 'translateY(calc(-100% + 17px))' },
        left: { transform: 'translateX(calc(-100% - 13px))', rotate: 'rotate(-90deg)' },
        bottom: { transform: 'translateY(calc(100% + 13px))', rotate: 'rotate(180deg)', reverse: 'translateY(calc(100% - 17px))' },
        right: { transform: 'translateX(calc(100% + 13px))', rotate: 'rotate(90deg)' },
    };

    // Split the provided position into vertical and horizontal alignment
    const [verticalAlign, horizontalAlign] = position.split(/(?=[A-Z])/);

    // Convert alignment strings to lowercase
    const verticalAlignLower = verticalAlign.toLowerCase();
    const horizontalAlignLower = horizontalAlign.toLowerCase();

    // Get the primary and secondary properties based on alignment
    const pickPropPrimary = commonProp[verticalAlignLower];
    const pickPropSecondary = commonProp[horizontalAlignLower];

    // Initialize the transform property with primary values
    let transformProperty = pickPropPrimary.transform + ' ' + pickPropPrimary.rotate;

    // Add the secondary property if specific conditions are met
    if ((verticalAlignLower === 'right' || verticalAlignLower === 'left') && horizontalAlignLower === 'left') {
        transformProperty += ' ' + pickPropSecondary.reverse;
    }

    // Construct the final positioning object
    const finalPosition = {
        [verticalAlignLower]: 0,
        [horizontalAlignLower]: 0,
        transform: transformProperty,
    };

    return finalPosition;
}

/**
 * Renders a multidimensional list as an HTML unordered list (ul) with nested list items (li).
 * The function is designed to work with a structured option list that includes children.
 *
 * @param {Array} optionList - An array representing the option list to render.
 * @returns {JSX.Element|null} - The JSX representation of the multidimensional list or null if the list is empty.
 */
export function renderMultiDimensionalList(optionList) {
    if (!optionList || optionList.length === 0) {
        return null;
    }
    return (
        <ul>
            {optionList.map(opt => {
                return (
                    <li key={opt.key}>
                        {opt.title}
                        {opt.children && opt.children.length > 0 && renderMultiDimensionalList(opt.children)}
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * Counts the number of items in a multidimensional list, including children and sub-children.
 * The function uses a recursive approach to traverse the nested structure and count items.
 *
 * @param {Array} optionList - An array representing the multidimensional list to count.
 * @returns {number} - The total count of items in the list, including children and sub-children.
 */
export function countMultiDimensionalList(optionList) {
    if (!optionList || optionList.length === 0) {
        return 0;
    }
    return optionList.reduce((accumulator, currentOption) => {
        if (Array.isArray(currentOption.children)) {
            return accumulator + countMultiDimensionalList(currentOption.children);
        } else {
            return accumulator + 1;
        }
    }, 0);
}
