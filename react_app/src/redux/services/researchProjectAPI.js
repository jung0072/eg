import {
    ACTIVATE_USER_PROJECT,
    ADD_USER_PROJECT,
    CALENDAR_REMINDERS,
    CALENDAR_REMINDER_TYPES,
    CREATE_PROJECT,
    CREATE_RESEARCH_TASK,
    EDIT_RESEARCH_TASK,
    GET_ACTIVE_PROJECT_MEMBER,
    GET_APPROVED_PROJECT_DATA,
    GET_USER_MENTIONS,
    JOIN_PROJECT,
    MODIFY_USER_PROJECT,
    REQUEST_JOIN_PROJECT,
    RESEARCH_INTERESTS,
    RESEARCH_PROJECT_BASE,
    RESEARCH_PROJECT_EDIT,
    RESEARCH_STUDY_BASE,
    RESEARCH_STUDY_FORM_DATA,
    RESEARCH_STUDY_INFO,
    USER_RECENT_RESEARCH_TASK_LIST,
    USER_RESEARCH_PROJECT_LIST,
    DELETE_MEMBER,
    DEACTIVATE_MEMBER,
    DEACTIVATE_SELF, PROMPT_USER_TO_JOIN_PROJECT
} from "../api_url";
import { rootAPI } from "./rootAPI.js";

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const researchProjectAPI = rootAPI.injectEndpoints({
    endpoints: builder => ({
        userResearchProjectListData: builder.query({
            query: () => `${BASE_URL}${USER_RESEARCH_PROJECT_LIST}`,
            providesTags: ['UserProjects'],
        }),
        researchTeamData: builder.query({
            query: (researchProjectID) => `${BASE_URL}${RESEARCH_PROJECT_BASE}${researchProjectID}/study_team/`
        }),
        userMentions: builder.query({
            query: ({ researchProjectID }) => `${BASE_URL}${GET_USER_MENTIONS}${researchProjectID}/`
        }),
        userRecentResearchTasks: builder.query({
            query: ({ researchProjectID }) => `${BASE_URL}${USER_RECENT_RESEARCH_TASK_LIST}${researchProjectID}/`
        }),
        addResearchTask: builder.mutation({
            query: (taskData) => {
                // if we have a task id, use the edit task route not the create task route
                return {
                    url: (taskData.taskID)
                        ? `${BASE_URL}${RESEARCH_PROJECT_BASE}${taskData.projectID}/${taskData.taskID}${EDIT_RESEARCH_TASK}`
                        : `${BASE_URL}${RESEARCH_PROJECT_BASE}${taskData.projectID}${CREATE_RESEARCH_TASK}`,
                    method: 'POST',
                    body: { ...taskData.taskFormData },
                };
            },
        }),
        researchInterestsData: builder.query({
            query: () => `${BASE_URL}${RESEARCH_INTERESTS}`
        }),
        createProject: builder.mutation({
            query: (researchProjectPostData) => {
                const { id: projectID } = researchProjectPostData;
                return {
                    url: (projectID)
                        ? `${BASE_URL}${RESEARCH_PROJECT_BASE}${projectID}${RESEARCH_PROJECT_EDIT}`
                        : `${BASE_URL}${CREATE_PROJECT}`,
                    method: (projectID) ? 'PATCH' : 'POST',
                    body: { ...researchProjectPostData }
                };
            }
        }),
        deleteProject: builder.mutation({
            query: (project_id) => {
                return {
                    url: `${BASE_URL}${RESEARCH_PROJECT_BASE}${project_id}${RESEARCH_PROJECT_EDIT}`,
                    method: 'DELETE',
                    body: { project_id }
                };
            }
        }),
        researchProjectInfo: builder.query({
            query: (projectID) => `${BASE_URL}${RESEARCH_STUDY_BASE}${projectID}${RESEARCH_STUDY_INFO}`,
            providesTags: ['CurrentProject', 'CurrentTask']
        }),
        getProjectActiveMembers: builder.query({
            query: ({ researchProjectID, includeAll }) => `${BASE_URL}${GET_ACTIVE_PROJECT_MEMBER}${researchProjectID}?includeAll=${includeAll}`,
            transformResponse: (memberData) => {
                const newMembersArray = [];
                memberData.map((member) => {
                    newMembersArray.push({
                        'value': member.id,
                        'label': member.first_name + ' ' + member.last_name,
                        'role': member.role
                    });
                });
                return newMembersArray;
            }
        }),
        getResearchProjectCalendarReminders: builder.query({
            query: (projectId) => `${BASE_URL}api/project/${projectId}${CALENDAR_REMINDERS}`,
        }),
        researchProjectCalendarReminders: builder.mutation({
            query: ({ values, projectID, updatingReminder, reminder_id }) => {
                return ({
                    url: `${BASE_URL}api/project/${projectID}${CALENDAR_REMINDERS}`,
                    method: updatingReminder ? 'PATCH' : 'POST',
                    body: { ...values, reminder_id }
                });
            }
        }),
        deleteResearchProjectCalendarReminders: builder.mutation({
            query: (values) => {
                return ({
                    url: `${BASE_URL}api/project/${values.id}${CALENDAR_REMINDERS}`,
                    method: 'DELETE',
                    body: { reminder_id: values.reminderId }
                });
            }
        }),
        requestToJoinProject: builder.mutation({
            query: (projectID) => ({
                url: `${BASE_URL}api/project/${projectID}${REQUEST_JOIN_PROJECT}`,
                method: "POST",
            }),
        }),
        addUserToProject: builder.mutation({
            query: (userFormData) => ({
                url: `${BASE_URL}api/project/${userFormData.projectID}${ADD_USER_PROJECT}`,
                method: 'POST',
                body: { ...userFormData }
            })
        }),
        joinProject: builder.mutation({
            query: (projectID) => ({
                url:`${BASE_URL}api/project/${projectID}${JOIN_PROJECT}`,
                method: "POST",
            }),
            invalidatesTags: ['CurrentProject'],
        }),
        activateUserParticipation: builder.query({
            query: ({ projectID, userID }) => `${BASE_URL}api/project/${projectID}${ACTIVATE_USER_PROJECT}${userID}/`
        }),
        modifyUserParticipation: builder.mutation({
            query: ({ projectID, userID, permissionLevel }) => ({
                url: `${BASE_URL}api/project/${projectID}${MODIFY_USER_PROJECT}${userID}/`,
                method: 'POST',
                body: { permission_level: permissionLevel }
            })
        }),
        researchProjectFormData: builder.query({
            query: () => `${BASE_URL}${RESEARCH_STUDY_FORM_DATA}`
        }),
        approvedResearchProjects: builder.query({
            query: () => `${BASE_URL}${GET_APPROVED_PROJECT_DATA}`
        }),
        calendarReminderTypes: builder.query({
            query: () => `${BASE_URL}${CALENDAR_REMINDER_TYPES}`
        }),
        deleteMemberFromProject: builder.mutation({
            query: ({ projectId, userId }) => ({
                url: `${BASE_URL}api/project/${projectId}${DELETE_MEMBER}${userId}/`,
                method: 'POST',
            })
        }),
        deactivateMemberFromProject: builder.mutation({
            query: ({ projectId, userId }) => ({
                url: `${BASE_URL}api/project/${projectId}${DEACTIVATE_MEMBER}${userId}/`,
                method: 'POST',
            })
        }),
        deactivateSelfFromProject: builder.mutation({
            query: ({ projectId }) => ({
                url: `${BASE_URL}api/project/${projectId}${DEACTIVATE_SELF}`,
                method: 'POST',
            })
        }),
        promptUserToJoinProject: builder.mutation({
            query: ({ projectID, userToPromptID }) => ({
                url: `${BASE_URL}api/project/${projectID}${PROMPT_USER_TO_JOIN_PROJECT}`,
                method: 'POST',
                body: { user_id: userToPromptID }
            })
        })
    })
});

export const {
    useUserResearchProjectListDataQuery,
    useResearchTeamDataQuery,
    useUserMentionsQuery,
    useUserRecentResearchTasksQuery,
    useAddResearchTaskMutation,
    useResearchInterestsDataQuery,
    useCreateProjectMutation,
    useResearchProjectInfoQuery,
    useLazyResearchProjectInfoQuery,
    useGetProjectActiveMembersQuery,
    useGetResearchProjectCalendarRemindersQuery,
    useResearchProjectCalendarRemindersMutation,
    useRequestToJoinProjectMutation,
    useAddUserToProjectMutation,
    useJoinProjectMutation,
    useActivateUserParticipationQuery,
    useLazyActivateUserParticipationQuery,
    useResearchProjectFormDataQuery,
    useApprovedResearchProjectsQuery,
    useModifyUserParticipationMutation,
    useCalendarReminderTypesQuery,
    useDeleteMemberFromProjectMutation,
    useDeactivateMemberFromProjectMutation,
    useDeactivateSelfFromProjectMutation,
    useDeleteProjectMutation,
    usePromptUserToJoinProjectMutation,
    useDeleteResearchProjectCalendarRemindersMutation,
} = researchProjectAPI;
