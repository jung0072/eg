const userRoles = {
    PATIENT: "PATIENT",
    FAMILY_OF_PATIENT: "FAMILY_OF_PATIENT",
    CARETAKER: "CARETAKER",
    RESEARCHER: "RESEARCHER",
    PASSIVE: "PASSIVE"
};

const questionTypes = {
    TEXT: "TEXT",
    NUMBER: "NUMBER",
    DATE: "DATE",
    SINGLE: "SINGLE",
    PARAGRAPH: "PARAGRAPH",
    TRUE_OR_FALSE: "TRUE_OR_FALSE",
    SELECT: "SELECT",
    SELECT_LARGE: "SELECT_LARGE",
    SELECT_PRIMARY: "SELECT_PRIMARY",
    MULTI_TEXT: "MULTI_TEXT",
    TEXT_OR_NA: "Text or Not Applicable",
    SECTION_SELECT: "SECTION_SELECT"
};

function getQuestionTextFromUserRole(
    userRole, textForFamilyOfPatient, textForCaretakerOfPatient, textForPatient, textForResearcher, textForPassive
) {

    switch (userRole) {
        case userRoles.CARETAKER:
            return textForCaretakerOfPatient;
        case userRoles.FAMILY_OF_PATIENT:
            return textForFamilyOfPatient;
        case userRoles.RESEARCHER:
            return textForResearcher;
        case userRoles.PATIENT:
            return textForPatient;
        case userRoles.PASSIVE:
            return textForPassive;
        default:
            console.error('This user role is not supported, please contact your admin', userRole);
    }
}
