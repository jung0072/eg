import {rootAPI} from "./rootAPI.js";
import {FAQ} from "../api_url";

export const faqAPI = rootAPI.injectEndpoints({
    endpoints: builder => ({
        getFAQList: builder.query({
            query: () => `${process.env.REACT_APP_BASE_URL}${FAQ}`,
        }),
        createFAQ: builder.mutation({
            query: faq => ({
                url: FAQ,
                method: 'POST',
                body: {...faq}
            })
        }),
        getQuestion: builder.query({
            query: (question_id) => `${process.env.REACT_APP_BASE_URL}${FAQ}${question_id}/`
        })
    })
});

export const {
    useGetFAQListQuery,
    useGetQuestionQuery,
    useCreateFAQMutation
} = faqAPI;
