from enum import Enum


class ListEnum(Enum):
    @classmethod
    def to_list(cls):
        return [(member.name, member.value) for member in cls]

    @classmethod
    def to_named_list(cls):
        return [member.name for member in cls]

    @classmethod
    def to_value_list(cls):
        return [member.value for member in cls]

    @classmethod
    def to_num_list(cls):
        return [counter + 1 for member, counter in enumerate(cls)]

    @classmethod
    def get_value_of_key(cls, key):
        return cls[key].value


class UserRoles(ListEnum):
    PATIENT = "Patient Partners"
    FAMILY_OF_PATIENT = "Family of Patient"
    CARETAKER = "Caretaker of Patient"
    RESEARCHER = "Researcher"
    PASSIVE = "Passive"
    CLINICIAN = "Clinician"

    @classmethod
    def get_project_partner_types(cls):
        return [
            (cls.PATIENT.name, cls.PATIENT.value),
            (cls.FAMILY_OF_PATIENT.name, cls.FAMILY_OF_PATIENT.value),
            (cls.CARETAKER.name, cls.CARETAKER.value)
        ]

    @classmethod
    def get_patient_partner_types(cls):
        return [
            cls.PATIENT.name, cls.FAMILY_OF_PATIENT.name, cls.CARETAKER.name
        ]

    @classmethod
    def get_research_partner_types(cls):
        return [cls.RESEARCHER.name, cls.CLINICIAN.name]


class ClinicalAreas(ListEnum):
    PCC = "Pediatric critical care"
    PEM = "Pediatric emergency medicine"
    ID = "Infectious disease"
    OTHER = "Other (free text to specify)"


class PartnerCommitmentPeriods(ListEnum):
    DAY = "daily"
    WEEK = "weekly"
    MONTH = "monthly"
    YEAR = "yearly"


class EngageViews(ListEnum):
    HOME = "home"
    MY_PROJECTS = "my_projects"
    ALL_PROJECTS = "all_projects"
    NEW_PROJECT = "new_project"
    PARTNER_DIRECTORY = "partner_directory"
    SETTINGS = "settings"
    ADMIN = "admin"


class QuestionTypes(ListEnum):
    TEXT = "Text"
    SELECT = "Select all that apply"
    # Updated Question Types from Rendering Engine
    TEXT_BODY = "TextInput"
    CHECKBOX = "Checkbox"
    DATE_PICKER = "DatePicker"
    DATE_PICKER_YEAR = "DatePickerYear"
    RADIO_BUTTON_BOX = "RadioButtonBox"
    RADIO_BUTTON_CIRCLE = "RadioButtonCircle"
    DROP_DOWN = "DropDown"
    TEXT_AREA = "TextArea"
    INPUT_TYPE = "InputType"
    UPLOAD_PICTURE = "UploadPicture"
    SELECT_MULTIPLE = "SelectMultiple"
    TREE_SELECT = "TreeSelect"
    SELECT_MULTIPLE_BOX = "SelectMultipleBox"
    URL = "WebLink"


class SystemMessageTypes(ListEnum):
    NOTIFICATION = "Notification"
    BLOG = "Blog"
    EMAIL = "Email"


class EngageFileCategory(ListEnum):
    """
    Type of files that are allowed to be uploaded for research projects.
    """
    PROJECT = "Research Project File"
    TASK = "Research Task File"
    SYSTEM = "System File"
    MESSAGE = "Chat Message Attachment"
    ADMIN = "Admin File"
    CONTACT = "Contact Log"


VALID_FILE_TYPES = [
    # Image types allowed:
    '.tif', '.tiff', '.bmp', '.jpg', '.jpeg', '.gif', '.png', '.eps',
    # Documents allowed
    '.xlsx', '.xls', '.doc', '.docx', '.pdf', '.csv', '.txt', '.pdf', '.ris', '.ppt', '.pptx'
]


class ResearchTaskDueStatues(ListEnum):
    DUE_SOON = "Task Due Soon"
    OVERDUE = "Task Overdue"
    ASSIGN = "Assign Task"  # TODO: change to assigned
    CLOSED = "Task Close"
    UNASSIGNED = "Unassigned"


class ResearchInterestTypes(ListEnum):
    RESEARCH = "Research"
    ICU_ADMISSIONS = "Intensive Care Unit Admissions"
    ICU_INTERVENTIONS = "Intensive Care Unit Interventions"
    ICU_OCCURRENCES = "Intensive Care Unit Occurrences"
    COMORBIDITY = "Comorbidities"
    INSTITUTION = "Institutions"


class ResearchStudyTypes(ListEnum):
    EDUCATION = "Education"
    GUIDELINE_DEVELOPMENT = "Guideline Development"
    PATIENT_SAFETY = "Patient Safety"
    QUALITY_IMPROVEMENT = "Quality Improvement"
    RESEARCH_STUDY = "Research Study"
    OTHER = "Other"


class ResearchStudyFormats(ListEnum):
    PROSPECTIVE_OBSERVATIONAL = "Prospective Observational"
    RCT = "RCT"
    RETROSPECTIVE_OBSERVATIONAL = "Retrospective Observational"
    SYSTEMATIC_REVIEW = "Scoping / Systematic Review"
    SURVEY = "Survey"
    OTHER = "Other"


class ResearchStudyReminderTypes(ListEnum):
    MEETING = "Work Meeting"
    ANNOUNCEMENT = "Announcement"
    CALL = "Call"
    NEW_PROJECT = "New Project"


class ParticipantDemographicTypes(ListEnum):
    RESEARCHER = "Researchers/ Clinicians"
    PATIENT = "Patient Partner/ Family of Patient"
    ALL = "Both"


class ProjectRecruitingStatus(ListEnum):
    OPEN = "Open"
    CLOSED = "Closed"


class ResearchTeamPermissionLevels(ListEnum):
    BASE = "Team Member"
    ADMIN = "Principal Investigator"
    LEAD = "Project Lead"
    REQUEST = "Requested to Join"
    INVITE = "Invited to Project"
    ERROR = "Not on Team / Unknown"

    @staticmethod
    def get_roles_on_project():
        return [
            ResearchTeamPermissionLevels.BASE.name, ResearchTeamPermissionLevels.ADMIN.name,
            ResearchTeamPermissionLevels.LEAD.name
        ]

    @staticmethod
    def get_roles_off_project():
        return [
            ResearchTeamPermissionLevels.REQUEST.name, ResearchTeamPermissionLevels.INVITE.name,
            ResearchTeamPermissionLevels.ERROR.name
        ]


class DateTypes(ListEnum):
    MONTH_YEAR = "MONTH_YEAR"
    YEAR = "YEAR"
    DAY_MONTH = "DAY_MONTH"
    EXACT_DATE = "EXACT_DATE"


class FAQTypes(ListEnum):
    GENERAL = "General"
    ACCOUNT = "Account Settings"


class ResearchProjectParticipantStages(ListEnum):
    ACTIVE = 'Joined Team'
    UNREGISTERED = 'Awaiting Registration to Platform'
    INCOMPLETE_PROFILE = 'Registered, Awaiting Profile Completion'
    REQUEST = 'Requested to Join, Awaiting Project Lead Approval'
    INVITE = 'Invited to Project, Awaiting Project Signup'


class ContactLogActionTypes(ListEnum):
    PENDING = "Pending / Not Started"
    DISCUSSION = "Discussion Required"
    ASSIGNED = "Assigned"
    DESIGN = "In Design"
    DEV = "In Development"
    CODE = "Code Review"
    REVIEW = "Review Ready"
    COMPLETE = "Completed"


class ContactLogPriorityTypes(ListEnum):
    NOT = "Not Assigned"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    SEVERE = "Severe"


class EngageReportTypes(ListEnum):
    PROJECT = "Project"
    TASK = "Task"
    MESSAGE = "Message"
    USER = "User"
    FILE = "File"
