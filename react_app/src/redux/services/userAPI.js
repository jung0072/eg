import {
    COMMUNITY_LIST,
    EDI_FORM, EDIT_PROFILE_SUBMIT,
    USER_PROFILE_PICTURE,
    GET_USER,
    USER_NOTIFICATIONS_LIST,
    USER_NOTIFICATIONS_LIST_READ,
    CHECK_USER_PROFILE,
    DIRECTORY_PREVIEW,
    USER_SEARCH,
    READ_NOTIFICATION,
    FORM_DATA,
    COMMUNITY_FILTERS,
    PUBLIC_USER_INFO,
    SYSTEM_MESSAGE, ARCHIVE_USER_PROJECT
} from "../api_url";
import { rootAPI } from "./rootAPI.js";
import { createSelector } from "@reduxjs/toolkit";

const BASE_URL = process.env.REACT_APP_BASE_API_URL;

export const userAPI = rootAPI.injectEndpoints({
    // to get the current user, can be used to display on home screen
    endpoints: builder => ({
        getUserData: builder.query({
            query: () => GET_USER,
            providesTags: ['CurrentUser']
        }),
        getPublicUserData: builder.query({
            query: (userID) => `${process.env.REACT_APP_BASE_URL}${PUBLIC_USER_INFO}${userID}`
        }),
        getUserNotifications: builder.query({
            query: () => `${process.env.REACT_APP_BASE_URL}${USER_NOTIFICATIONS_LIST}`,
            providesTags: ['CurrentUser', 'Notifications']
        }),
        readAllUserNotifications: builder.query({
            query: () => `${process.env.REACT_APP_BASE_URL}${USER_NOTIFICATIONS_LIST_READ}`,
            invalidatesTags: ['Notifications']
        }),
        saveEdiInfo: builder.mutation({
            query: (edi) => {
                return {
                    url: `${process.env.REACT_APP_BASE_URL}${EDI_FORM}`,
                    method: 'POST',
                    body: { ...edi },
                };
            },
        }),
        ediData: builder.query({
            query: () => `${process.env.REACT_APP_BASE_URL}${EDI_FORM}`,
        }),
        saveUserProfile: builder.mutation({
            query: (userPostData) => {
                // Check if the user is submitting for review, if so we can add the extra header
                const headerData = {};
                if ("submit_for_review" in userPostData) {
                    delete userPostData.submit_for_review;
                    headerData['X-SUBMIT-RESEARCHER-FOR-REVIEW'] = true;
                }
                return {
                    url: `${process.env.REACT_APP_BASE_URL}${EDIT_PROFILE_SUBMIT}`,
                    method: (userPostData.method) ? userPostData.method : 'POST',
                    body: { ...userPostData },
                    headers: headerData
                };
            },
            invalidatesTags: ['CurrentUser', 'UserProfileCheck']
        }),
        uploadUserProfilePicture: builder.mutation({
            query: (formData) => {
                const userId = formData.get('userId');
                return {
                    url: `${process.env.REACT_APP_BASE_URL}${USER_PROFILE_PICTURE}${userId}`,
                    method: 'POST',
                    body: formData
                };
            },
            invalidatesTags: ['CurrentUser']
        }),
        getUserProfileFormValues: builder.query({
            query: (userPostData) => `${process.env.REACT_APP_BASE_URL}${EDIT_PROFILE_SUBMIT}`,
            providesTags: ['CurrentUser']
        }),
        getCommunityList: builder.query({
            query: () => `${process.env.REACT_APP_BASE_URL}${COMMUNITY_LIST}`,
        }),
        searchCommunityList: builder.mutation({
            query: (formData) => ({
                url: `${process.env.REACT_APP_BASE_URL}${COMMUNITY_LIST}`,
                method: 'POST',
                body: formData
            })
        }),
        checkUserProfileCompletion: builder.query({
            query: () => `${process.env.REACT_APP_BASE_URL}${CHECK_USER_PROFILE}`,
            providesTags: ['UserProfileCheck']
        }),
        previewUserList: builder.query({
            query: () => `${process.env.REACT_APP_BASE_URL}${DIRECTORY_PREVIEW}`
        }),
        searchUserType: builder.query({
            query: (userType) => `${process.env.REACT_APP_BASE_URL}${USER_SEARCH}${userType}`
        }),
        readNotification: builder.query({
            query: (notificationID) => `${process.env.REACT_APP_BASE_URL}${READ_NOTIFICATION}${notificationID}`,
            invalidatesTags: ['Notifications']
        }),
        userRenderChanFormData: builder.query({
            query: () => `${process.env.REACT_APP_BASE_URL}${FORM_DATA}`
        }),
        communityListFilters: builder.query({
            query: () => `${BASE_URL}${COMMUNITY_FILTERS}`,
            providesTags: ['CurrentUser']
        }),
        getAllSystemMessages: builder.query({
            query: () => `${BASE_URL}${SYSTEM_MESSAGE}`,
            method: 'GET',
            providesTags: ['SystemMessage']
        }),
        getSystemMessage: builder.query({
            query: (messageId) => `${BASE_URL}${SYSTEM_MESSAGE}${messageId}`,
            method: 'GET',
            providesTags: ['SystemMessage']
        }),
        archiveProject: builder.mutation({
            query: (archivedProjectData) => ({
                url: `${BASE_URL}${ARCHIVE_USER_PROJECT}`,
                method: 'POST',
                body: archivedProjectData
            }),
            invalidatesTags: ['UserProjects'],
        })
    })
});

export const {
    useGetUserDataQuery,
    useLazyGetUserDataQuery,
    useGetUserNotificationsQuery,
    useLazyReadAllUserNotificationsQuery,
    useGetPublicUserDataQuery,
    useEdiDataQuery,
    useSaveEdiInfoMutation,
    useGetUserProfileFormValuesQuery,
    useSaveUserProfileMutation,
    useUploadUserProfilePictureMutation,
    useGetCommunityListQuery,
    useCheckUserProfileCompletionQuery,
    usePreviewUserListQuery,
    useLazySearchUserTypeQuery,
    useLazyReadNotificationQuery,
    useUserRenderChanFormDataQuery,
    useLazyUserRenderChanFormDataQuery,
    useCommunityListFiltersQuery,
    useSearchCommunityListMutation,
    useGetAllSystemMessagesQuery,
    useGetSystemMessageQuery,
    useArchiveProjectMutation
} = userAPI;

export const selectCurrentUserData = userAPI.endpoints.getUserData.select();
export const selectCurrentUserFormValues = userAPI.endpoints.getUserProfileFormValues.select();
export const selectCurrentUserNotifications = userAPI.endpoints.getUserNotifications.select();
export const selectCurrentUserProfileCompletionCheck = userAPI.endpoints.checkUserProfileCompletion.select();

export const selectLoggedInUserData = createSelector(
    selectCurrentUserData,
    userResult => userResult?.data ?? null
);

export const selectLoggedInUserFormValues = createSelector(
    selectCurrentUserFormValues,
    userResult => userResult?.data ?? null
);

export const selectLoggedInUserNotification = createSelector(
    selectCurrentUserNotifications,
    userResult => userResult.data ?? null
);

export const selectUserProfileCheck = createSelector(
    selectCurrentUserProfileCompletionCheck,
    profileCheck => profileCheck.data ?? null
);
