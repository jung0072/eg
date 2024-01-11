import {
    ADMIN_ENGAGE_REPORT_UPDATE
} from "../api_url.jsx";
import { rootAPI } from "./rootAPI.js";

const engageReportsAPI = rootAPI.injectEndpoints({
    endpoints: (builder) => ({
        postEngageReport: builder.mutation({
            query: ({ engageReportRequestBody }) => ({
                url: `${process.env.REACT_APP_BASE_API_URL}${ADMIN_ENGAGE_REPORT_UPDATE}`,
                method: 'POST',
                body: engageReportRequestBody
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
    }),
});

export const {
    useUpdateEngageReportMutation,
    useGetEngageReportQuery,
    usePostEngageReportMutation,
} = engageReportsAPI;
