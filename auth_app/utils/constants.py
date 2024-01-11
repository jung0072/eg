from background_task.models import Task

from engage_app.utils.constants import ListEnum


class UserQuestionCode(ListEnum):
    RELATIONSHIP = "RLP"
    GENDER = "GND"
    CITY = "CTY"
    LANGUAGE = "LNG"
    ETHNICITY = "ETY"
    DATE_OF_BIRTH = "DOB"
    LEVEL_OF_EDUCATION = "EDU"
    DISABILITY = "DSB"
    HOUSEHOLD_SALARY = "HHS"
    SURVIVAL = "SVE"
    INTENSIVE_CARE_UNIT = "ICU"
    TRANSPORTED_FROM_HOSPITAL = "TFH"
    UNIVERSITY_AFFILIATION = "UNV"
    HOSPITAL_AFFILIATION = "AFN"
    IMMIGRATION_TO_CANADA = "IMG"
    ANOTHER_IMPORTANT_AFFILIATION = "AIA"
    CLINICAL_AREA = "CNL"


# Constants of Enquiry Type for Contact Us operation
class ContactEnquiryTypes(ListEnum):
    ITS = 'IT Support'
    PRJ = 'Regarding Project'
    MSG = 'Message Centre'
    PRI = 'Privacy Concern'
    SGI = 'Suggest Improvement'
    OTH = 'Other'


class SupportScreens(ListEnum):
    HOME = 'Home page'
    COMMUNITY = 'Community page'
    USER_PROFILE_DETAILS = 'User profile details'
    CUSTOMIZE_USER_PROFILE_FORMS = 'Customize User Profile Forms'
    PROJECT_LIST = 'Project List page'
    PROJECT_DETAILS = 'Project details page'
    CREATE_PROJECT = 'Create Project page'
    EDIT_PROJECT = 'Edit Project page'
    RESEARCH_TASK_DETAIL = 'Research task details page'
    MESSAGE_CENTRE = 'Message Centre'
    CONTACT_US = 'Contact Us Form'
    SYSTEM_ISSUES = 'System Issues'
    FAQ = 'FAQ’s'
    LOGIN = 'Login'
    SIGNUP = 'Signup'


# The following classes are used for the EDI questionnaire for both insight-scope and engage
class EDIGenderTypes(ListEnum):
    AGND = "Agender"
    BGND = "Bigender / Multigender"
    GNDF = "Gender-fluid"
    GNDQ = "Gender-Queer"
    MAN = "Man"
    NON = "Nonbinary"
    TRANS = "Transgender"
    TWO_SPIRIT = "Two-Spirit"
    QUES = "Questioning"
    WOMEN = "Woman"
    OTHER_OPTION = "A gender not specified above. Specify:"
    NA = "I prefer not to answer"


class EDISexualOrientation(ListEnum):
    ACE = "Asexual"
    BI = "Bisexual"
    GAY = "Gay"
    HETERO = "Heterosexual"
    LES = "Lesbian"
    PAN = "Pansexual"
    QUEER = "Queer"
    TWO_SPIRIT = "Two-Spirit"
    OTHER_OPTION="I don't identify with any option provided. I identify as: (option to specify)"
    NA = "I prefer not to answer"


class EDIBooleanFormTypes(ListEnum):
    YES = "Yes"
    NO = "No"
    NA = "I prefer not to answer"


class EDIPopulationGroups(ListEnum):
    ARAB = "Arab"
    BLACK = "Black"
    CHINESE = "Chinese"
    FILIPINO = "Filipino"
    JAPANESE = "Japanese"
    KOREAN = "Korean"
    LATIN_AMERICAN = "Latin American"
    SOUTH_ASIAN = "South Asian(e.g., East Indian, Pakistani, Sri Lankan, etc.)"
    SOUTH_EAST_ASIAN = "Southeast Asian(e.g., Vietnamese, Cambodian, Laotian, Thai, etc.)"
    WEST_ASIAN = "West Asian(e.g., Iranian, Afghan, etc.)"
    WHITE = "White"
    NO_OPTION = "Population group not listed above"
    NA = "I prefer not to answer"


class EDILanguageTypes(ListEnum):
    ENGLISH = "English"
    FRENCH = "French"
    ANOTHER = "Another language"
    NA = "I prefer not to answer"


class EDISexAtBirth(ListEnum):
    MAN = "Male"
    WOMEN = "Female"
    NA = "I prefer not to answer"


class EDIDisabilityType(ListEnum):
    COMMUNICATION = "Communications"
    DEVELOPMENTAL = "Developmental"
    DEXTERITY = "Dexterity"
    FLEXIBILITY = "Flexibility"
    HEARING = "Hearing"
    LEARNING = "Learning"
    MENTAL_HEALTH_RELATED = "Mental health-related"
    MEMORY = "Memory"
    MOBILITY = "Mobility"
    PAIN_RELATED = "Pain-related"
    SEEING = "Seeing"
    OTHER_OPTION = "Disability not listed above: (option to specify)"
    NA = "I prefer not to answer"


class EDIIndigenousType(ListEnum):
    FNA = "First Nations"
    INT = "Inuit"
    MET = "Metis"
    NA = "I prefer not to answer"


class EDIVisibilityType(ListEnum):
    TRUE = "Everyone can see this"
    FALSE = "No one can see this"


class EDITypes:
    GENDER = EDIGenderTypes
    SEX = EDISexualOrientation
    BOOL = EDIBooleanFormTypes
    POPULATION = EDIPopulationGroups
    LANGUAGE = EDILanguageTypes
    DISABILITY_TYPE = EDIDisabilityType
    BIRTH_SEX = EDISexAtBirth
    INDI_TYPE = EDIIndigenousType
    EDI_VISIBILITY_TYPE = EDIVisibilityType


class ADMIN_SETTINGS_TYPE(ListEnum):
    TEXT = "Text"
    BOOLEAN = "Boolean"
    INTEGER = "Integer"
    DATETIME = "Datetime"
    SELECT = "Select"


class ADMIN_SETTINGS_NAME(ListEnum):
    APPROVAL_REQUIRED_FOR_RESEARCHERS = "Approval Required for Researchers"
    APPROVAL_REQUIRED_FOR_PROJECTS = "Approval Required for Projects"

class BACKGROUND_TASKS_NAME(ListEnum):
    BACKGROUND_TASK_UNREAD_NOTIFICATIONS = "Unread Notifications Background Task Duration"
    PERIODIC_EMAILS_ENABLED = "Are Periodic Background Emails Enabled"
    PERIODIC_EMAILS_STARTS = "Periodic Emails Repetition"

class BACKGROUND_TASK_DURATIONS:
    DAILY = {
        'label': 'Daily',
        'value': str(Task.DAILY),
    }
    WEEKLY = {
        'label': 'Weekly',
        'value': str(Task.WEEKLY)
    }
    BI_WEEKLY = {
        'label': 'Bi-weekly',
        'value': str(Task.EVERY_2_WEEKS)
    }
    MONTHLY = {
        'label': 'Monthly',
        'value': str(Task.EVERY_4_WEEKS)
    }
    YEARLY = {
        'label': 'Yearly',
        'value': str(12 * Task.EVERY_4_WEEKS)
    }
    NEVER = {
        'label': 'Never',
        'value': str(Task.NEVER)
    }

    @classmethod
    def to_list(cls):
        return [cls.NEVER, cls.DAILY, cls.WEEKLY, cls.BI_WEEKLY, cls.MONTHLY, cls.YEARLY]


ADMIN_SYSTEM_SETTINGS_LIST = [
    {'name': ADMIN_SETTINGS_NAME.APPROVAL_REQUIRED_FOR_RESEARCHERS.value, 'data_type': ADMIN_SETTINGS_TYPE.BOOLEAN.value},
    {'name': ADMIN_SETTINGS_NAME.APPROVAL_REQUIRED_FOR_PROJECTS.value, 'data_type': ADMIN_SETTINGS_TYPE.BOOLEAN.value}
]

BACKGROUND_TASK_LIST = [
    {'name': BACKGROUND_TASKS_NAME.BACKGROUND_TASK_UNREAD_NOTIFICATIONS.value, 'data_type': ADMIN_SETTINGS_TYPE.SELECT.value,
     'select_options': BACKGROUND_TASK_DURATIONS.to_list(), 'selected_value': BACKGROUND_TASK_DURATIONS.YEARLY.get('value'), 'text_value': ""},
    {'name': BACKGROUND_TASKS_NAME.PERIODIC_EMAILS_ENABLED.value, 'data_type': ADMIN_SETTINGS_TYPE.BOOLEAN.value,
     'select_options': [], 'selected_value': '', 'text_value': ""},
    {'name': BACKGROUND_TASKS_NAME.PERIODIC_EMAILS_STARTS.value, 'data_type': ADMIN_SETTINGS_TYPE.TEXT.value,
     'select_options': [], 'selected_value': '', 'text_value': "1,1"}
]

API_URLS = [
    '/home/',
    '/notifications/',
    '/community/',
    '/projects/',
]

URL_EXCLUSION = [
    '/api/login',
    '/api/signup',
    '/api/token/refresh'
]

ACCOUNT_CREATED_SUCCESSFULLY = 'Account created successfully, please check your emails to verify your account'

ALREADY_EXIST = '{data} already exists'

EDI_SECTION_ID = 'c0edc627-7767-43f2-9347-d78390f3d322'

EDI_FIELDS_DEV_CODE = {
        'E-DOB': {'field': 'year_of_birth', 'type': None},
        'E-GND': {'field': 'gender', 'type': EDITypes.GENDER},
        'E-SEX': {'field': 'birth_sex', 'type': EDITypes.BIRTH_SEX},
        'E-SEOR': {'field': 'sexual_orientation', 'type': EDITypes.SEX},
        'E-INA': {'field': 'is_identified_native', 'type': EDITypes.BOOL},
        'E-NAT': {'field': 'indigenous_type', 'type': EDITypes.INDI_TYPE},
        'E-MIN': {'field': 'is_visible_minority', 'type': EDITypes.BOOL},
        'E-POP': {'field': 'population_group', 'type': EDITypes.POPULATION},
        'E-IDS': {'field': 'has_disability', 'type': EDITypes.BOOL},
        'E-DSB': {'field': 'disability_type', 'type': EDITypes.DISABILITY_TYPE},
        'E-FLG': {'field': 'first_language', 'type': EDITypes.LANGUAGE},
        'E-MLG': {'field': 'most_used_language', 'type': EDITypes.LANGUAGE},
        'E-SETTING': {'field': 'is_edi_visible', 'type': EDITypes.BOOL},
    }


class PLATFORMS(ListEnum):
    ENGAGE = "Engage"
    EDUCATE = "Educate"
    INSIGHTSOCPE = "insightScope"
