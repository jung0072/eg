import { rootAPI } from "./rootAPI.js";
import {
    SIGNUP,
    LOGIN,
    LOGOUT,
    RESET_PASSWORD,
    CONFIRM_RESET_PASSWORD,
    CHECK_CONFIRM_RESET_PASSWORD,
    CANADIAN_CITY_DATA,
    CONTACT_US,
    AUTH_CONTACT_US,
    ACTIVATE_USER_ACCOUNT,
    SIGNUP_WITH_INSIGHTSCOPE,
    RESEND_ACTIVATION_EMAIL,
    CHECK_PLATFORM_STATUS,
} from "../api_url";
import { Constants } from "../../components/utils/index.js";

export const authAPI = rootAPI.injectEndpoints({
    endpoints: builder => ({
        login: builder.mutation({
            query: credential => ({
                url: LOGIN,
                method: 'POST',
                body: { ...credential }
            })
        }),
        signup: builder.mutation({
            query: userdata => ({
                url: SIGNUP,
                method: 'POST',
                body: { ...userdata }
            })
        }),
        logout: builder.mutation({
            query: refreshToken => ({
                url: LOGOUT,
                method: 'POST',
                body: { ...refreshToken }
            }),
            invalidatesTags: ['CurrentUser', 'UserProfileCheck']
        }),
        contact: builder.mutation({
            query: ({ values, is_user }) => ({
                url: is_user ? CONTACT_US : AUTH_CONTACT_US,
                method: 'POST',
                body: { ...values }
            }),
            invalidatesTags: ['SystemIssues']
        }),
        getCities: builder.query({
            query: () => `${process.env.REACT_APP_BASE_API_URL}${CANADIAN_CITY_DATA}`
        }),
        getContactLog: builder.query({
            query: () => `${process.env.REACT_APP_BASE_API_URL}contact_us/`,
            transformResponse: (data) => {
                const systemLogsData = { admin: data.admin, logs: [] };

                data.logs.map((systemLogs) => {
                    const submittedOn = new Date(systemLogs.created_at).toLocaleDateString();
                    systemLogsData.logs.push({
                        'key': systemLogs.id,
                        'enquiry_type': Constants.ENQUIRY_OPTIONS.find((res) => res.value === systemLogs.enquiry_type)?.label,
                        'support_screen': Constants.SCREENS.find((res) => res.value === systemLogs.support_screen)?.label,
                        'message': systemLogs.message,
                        'created_at': submittedOn,
                        'username': systemLogs.first_name + ' ' + systemLogs.last_name,
                        'email_address': systemLogs.email_address,
                        'screenshot': systemLogs.screenshot_base64,
                        'hasScreenshot': (!!systemLogs.screenshot_base64),
                        'action_stage': systemLogs.action_stage,
                        'priority': systemLogs.priority,
                        'is_complete': systemLogs.is_complete,
                        'updated_at': systemLogs.updated_at
                    });
                });
                return systemLogsData;
            },
            providesTags: ['SystemIssues']
        }),
        resetPassword: builder.mutation({
            query: email => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${RESET_PASSWORD}`,
                method: 'POST',
                body: { ...email }
            })
        }),
        confirmResetPassword: builder.mutation({
            query: resetPasswordCredentials => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${CONFIRM_RESET_PASSWORD}`,
                method: 'POST',
                body: { ...resetPasswordCredentials }
            })
        }),
        checkResetPasswordToken: builder.query({
            query: (data) => `${process.env.REACT_APP_BASE_API_URL}${CHECK_CONFIRM_RESET_PASSWORD}?token=${data.token}&encoded_user_id=${data.uidb64}`
        }),
        activateUserAccount: builder.mutation({
            query: ({ token }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${ACTIVATE_USER_ACCOUNT}`,
                method: 'POST',
                body: { access: token }
            })
        }),
        signupWithInsightScope: builder.mutation({
            query: credentials => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${SIGNUP_WITH_INSIGHTSCOPE}`,
                method: 'POST',
                body: { ...credentials }
            })
        }),
        resendActivationEmail: builder.mutation({
            query: data => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${RESEND_ACTIVATION_EMAIL}`,
                method: 'POST',
                body: { ...data }
            })
        }),
        checkPlatformStatus: builder.query({
            query: () => `${process.env.REACT_APP_BASE_API_URL}${CHECK_PLATFORM_STATUS}`
        }),
    })
});

export const {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useContactMutation,
    useGetContactLogQuery,
    useGetCitiesQuery,
    useResetPasswordMutation,
    useConfirmResetPasswordMutation,
    useCheckResetPasswordTokenQuery,
    useActivateUserAccountMutation,
    useSignupWithInsightScopeMutation,
    useResendActivationEmailMutation,
    useCheckPlatformStatusQuery,
} = authAPI;
