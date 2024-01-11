import {
    SYSTEM_USER_MANAGEMENT,
    PENDING_PROJECTS,
    PENDING_RESEARCHERS,
    PROJECT_MANAGEMENT,
    GET_CHAT_LOGS_FOR_PROJECT,
    SYSTEM_MESSAGE,
    SYSTEM_SETTINGS,
    USER_PROFILE_QUESTION_ADMIN,
    USER_PROFILE_QUESTION_DETAILS_ADMIN,
    CREATE_USER_PROFILE_QUESTION_ADMIN,
    ADMIN_ACTIVATE_USER,
    RESET_USER_PASSWORD_ADMIN,
    ADMIN_CONTACT_US_UPDATE,
    ADMIN_ENGAGE_REPORT_UPDATE,
    RESEARCH_INTEREST_CATEGORIES,
    RESEARCH_INTEREST_OPTIONS,
} from "../api_url.jsx";
import { rootAPI } from "./rootAPI.js";

const adminAPI = rootAPI.injectEndpoints({
    endpoints: (builder) => ({
        getPendingResearchers: builder.query({
            query: () =>
                `${process.env.REACT_APP_BASE_URL}${PENDING_RESEARCHERS}`,
            transformResponse: (data) => {
                const pendingResearchersObject = [];
                data?.pending_researchers.map((researcher) => {
                    const submittedOn = new Date(
                        researcher?.researcher_form_review_date
                    ).toLocaleDateString();
                    pendingResearchersObject.push({
                        ...researcher,
                        uid: researcher.user,
                        name: `${researcher.first_name} ${researcher.last_name}`,
                        submitted_on: submittedOn,
                    });
                });
                return pendingResearchersObject;
            },
        }),
        approveResearchers: builder.mutation({
            query: (researcherId) => {
                return {
                    url: `${process.env.REACT_APP_BASE_URL}${PENDING_RESEARCHERS}`,
                    method: "POST",
                    body: { researcher_id: researcherId },
                };
            },
        }),
        pendingResearchProjects: builder.query({
            query: () => `${process.env.REACT_APP_BASE_URL}${PENDING_PROJECTS}`,
            transformResponse: (data) => {
                return data.map((project) => ({
                    ...project,
                    pid: project.id,
                    title: project.title,
                    submittedOn: project.review_date ? new Date(project.review_date).toLocaleDateString() : "Not submitted",
                    updatedAt: new Date(project.updated_at).toLocaleDateString(),
                }));
            },
        }),
        approveResearchProject: builder.mutation({
            query: (project_id) => ({
                url: `${process.env.REACT_APP_BASE_URL}${PENDING_PROJECTS}`,
                method: "POST",
                body: { project_id },
            }),
        }),
        getSystemUsers: builder.query({
            query: () =>
                `${process.env.REACT_APP_BASE_API_URL}${SYSTEM_USER_MANAGEMENT}`,
            providesTags: ["SystemUserInformation"],
        }),
        deleteUser: builder.mutation({
            query: (user_id) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${SYSTEM_USER_MANAGEMENT}`,
                method: "DELETE",
                body: { user_id },
            }),
            invalidatesTags: ["SystemUserInformation"],
        }),
        changeUserRole: builder.mutation({
            query: (newRoleData) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${SYSTEM_USER_MANAGEMENT}`,
                method: "PATCH",
                body: { ...newRoleData },
            }),
            invalidatesTags: ["SystemUserInformation"],
        }),
        getAllResearchProjectData: builder.query({
            query: () =>
                `${process.env.REACT_APP_BASE_API_URL}${PROJECT_MANAGEMENT}`,
            transformResponse: (data) => {
                return data.map((project) => ({
                    ...project,
                    submittedOn: project.review_date ? new Date(project.review_date).toLocaleDateString() : "Not submitted",
                    updatedAt: new Date(project.updated_at).toLocaleDateString(),
                }));
            },
        }),
        getChatLogsForProject: builder.query({
            query: (project_id) =>
                `${process.env.REACT_APP_BASE_API_URL}${GET_CHAT_LOGS_FOR_PROJECT}${project_id}`,
        }),
        deleteProject: builder.mutation({
            query: (project_id) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${PROJECT_MANAGEMENT}`,
                method: "DELETE",
                body: { project_id },
                invalidatesTags: ["ResearchProjectData"],
            }),
        }),
        postSystemMessage: builder.mutation({
            query: (messageData) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${SYSTEM_MESSAGE}`,
                method: "POST",
                body: messageData,
            }),
            invalidatesTags: ['SystemMessage'],
        }),
        updateSystemMessage: builder.mutation({
            query: ({ messageData, messageId }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${SYSTEM_MESSAGE}${messageId}/`,
                method: 'PUT',
                body: messageData
            }),
            invalidatesTags: ['SystemMessage']
        }),
        deleteSystemMessage: builder.mutation({
            query: (messageId) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${SYSTEM_MESSAGE}${messageId}`,
                method: "DELETE",
            }),
            invalidatesTags: ['SystemMessage']
        }),
        getSystemSettings: builder.query({
            query: () => `${process.env.REACT_APP_BASE_API_URL}${SYSTEM_SETTINGS}`,
            providesTags: ["SystemSettingsData"]
        }),
        updateSystemSettings: builder.mutation({
            query: (settingsData) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${SYSTEM_SETTINGS}`,
                method: "PATCH",
                body: settingsData,
                invalidatesTags: ["SystemSettingsData"]
            })
        }),
        userProfileQuestions: builder.query({
            query: () => `${process.env.REACT_APP_BASE_API_URL}${USER_PROFILE_QUESTION_ADMIN}`,
            providesTags: ["AllUserProfileQuestionAdminData"]
        }),
        userProfileQuestionDetails: builder.query({
            query: ({ questionID }) => `${process.env.REACT_APP_BASE_API_URL}${USER_PROFILE_QUESTION_DETAILS_ADMIN}${questionID}/`,
            providesTags: ["UserProfileQuestionAdminData"]
        }),
        postUserProfileQuestionAdmin: builder.mutation({
            query: ({ questionBody, questionID }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${CREATE_USER_PROFILE_QUESTION_ADMIN}`,
                method: "POST",
                body: questionBody,
            }),
            invalidatesTags: ['UserProfileQuestionAdminData', 'AllUserProfileQuestionAdminData'],
        }),
        updateUserProfileQuestionAdmin: builder.mutation({
            query: ({ questionBody, questionID }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${USER_PROFILE_QUESTION_DETAILS_ADMIN}${questionID}/`,
                method: "PATCH",
                body: questionBody,
            }),
            invalidatesTags: ['UserProfileQuestionAdminData', 'AllUserProfileQuestionAdminData'],
        }),
        deleteUserProfileQuestionAdmin: builder.mutation({
            query: ({ questionID }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${USER_PROFILE_QUESTION_DETAILS_ADMIN}${questionID}/`,
                method: "DELETE",
            }),
            invalidatesTags: ['UserProfileQuestionAdminData', 'AllUserProfileQuestionAdminData'],
        }),
        activateUser: builder.mutation({
            query: ({ userID }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${ADMIN_ACTIVATE_USER}${userID}/`,
                method: "POST",
                body: ''
            }),
            invalidatesTags: ['SystemUserInformation']
        }),
        resetUserPassword: builder.mutation({
            query: ({ userID }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${RESET_USER_PASSWORD_ADMIN}${userID}/`,
                method: "PATCH",
                body: ''
            }),
            invalidatesTags: ['SystemUserInformation']
        }),
        updateContactLogRequest: builder.mutation({
            query: ({ contactLogID, contactLogRequestBody }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${ADMIN_CONTACT_US_UPDATE}${contactLogID}/`,
                method: 'PATCH',
                body: contactLogRequestBody
            })
        }),
        updateEngageReport: builder.mutation({
            query: ({ engageReportID, engageReportRequestBody }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${ADMIN_ENGAGE_REPORT_UPDATE}${engageReportID}/`,
                method: 'PATCH',
                body: engageReportRequestBody
            })
        }),
        getEngageReport: builder.query({
            query: () => `${process.env.REACT_APP_BASE_API_URL}${ADMIN_ENGAGE_REPORT_UPDATE}`,
        }),
        getResearchInterestCategories: builder.query({
            query: () => `${process.env.REACT_APP_BASE_API_URL}${RESEARCH_INTEREST_CATEGORIES}`,
            providesTags: ["ResearchInterestsCategoryAdminData"]
        }),
        createResearchInterestCategory: builder.mutation(({
            query: ({ title, description }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${RESEARCH_INTEREST_CATEGORIES}`,
                method: 'POST',
                body: { title, description, mapping: title.replaceAll(' ', '_').toLocaleUpperCase() }
            })
        })),
        updateResearchInterestCategory: builder.mutation(({
            query: ({ title, description, categoryID }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${RESEARCH_INTEREST_CATEGORIES}${categoryID}/`,
                method: 'PATCH',
                body: { title, description, mapping: title.replaceAll(' ', '_').toLocaleUpperCase() }
            })
        })),
        deleteResearchInterestCategory: builder.mutation(({
            query: ({ categoryID }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${RESEARCH_INTEREST_CATEGORIES}${categoryID}/`,
                method: 'DELETE',
            })
        })),
        getResearchInterestOptions: builder.query({
            query: (categoryID) => `${process.env.REACT_APP_BASE_API_URL}${RESEARCH_INTEREST_OPTIONS}${categoryID}/`,
            providesTags: ["ResearchInterestsOptionsAdminData"]
        }),
        submitResearchInterestOptions: builder.mutation({
            query: ({ categoryID, options }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${RESEARCH_INTEREST_OPTIONS}${categoryID}/`,
                method: "POST",
                body: options
            }),
        }),
    }),
});

export const {
    useGetPendingResearchersQuery,
    useApproveResearchersMutation,
    usePendingResearchProjectsQuery,
    useApproveResearchProjectMutation,
    useGetSystemUsersQuery,
    useDeleteUserMutation,
    useChangeUserRoleMutation,
    useGetAllResearchProjectDataQuery,
    useGetChatLogsForProjectQuery,
    useLazyGetChatLogsForProjectQuery,
    useDeleteProjectMutation,
    usePostSystemMessageMutation,
    useUpdateSystemMessageMutation,
    useDeleteSystemMessageMutation,
    useGetSystemSettingsQuery,
    useUpdateSystemSettingsMutation,
    useUserProfileQuestionsQuery,
    useLazyUserProfileQuestionDetailsQuery,
    usePostUserProfileQuestionAdminMutation,
    useUpdateUserProfileQuestionAdminMutation,
    useDeleteUserProfileQuestionAdminMutation,
    useActivateUserMutation,
    useResetUserPasswordMutation,
    useUpdateContactLogRequestMutation,
    useUpdateEngageReportMutation,
    useGetEngageReportQuery,
    useGetResearchInterestCategoriesQuery,
    useGetResearchInterestOptionsQuery,
    useLazyGetResearchInterestOptionsQuery,
    useSubmitResearchInterestOptionsMutation,
    useCreateResearchInterestCategoryMutation,
    useUpdateResearchInterestCategoryMutation,
    useDeleteResearchInterestCategoryMutation,
} = adminAPI;
