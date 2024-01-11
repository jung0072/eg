import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, logOut } from "../slicers/authSlice.js";
import { GET_REFRESH_TOKEN } from "../api_url";


const baseQuery = fetchBaseQuery({
    baseUrl: process.env.REACT_APP_BASE_API_URL,
    credentials: 'include',
    prepareHeaders: (headers, {getState}) => {

        const access = sessionStorage.getItem("access")
        if(access) {
            headers.set("Authorization", `Bearer ${access}`)
        }

        return headers
    }
})

const baseQueryWithReauth = async(args, api, extraOption, overrideRoute) => {
    
    let result = await baseQuery(args, api, extraOption)

    if(result?.error?.status === 401) {

        // more errors can be handled here
        sessionStorage.setItem("access", "")
        // send refresh token to get new access token
        const refreshResult = await baseQuery(
            {
              url: GET_REFRESH_TOKEN,
              method: 'POST',
              body: {
                refresh: sessionStorage.getItem("refresh"),
              },
            },
            api,
            extraOption
          );


        if(refreshResult?.data) {
            const user = api.getState().auth.username
            
            //  store the new token 
            refreshResult.data['refresh'] = sessionStorage.getItem("refresh")
            
            api.dispatch(setCredentials({...refreshResult.data, user}))

            // retry the original query with new access token
            result = await baseQuery(args, api, extraOption)
        } else {
            // if refresh token is also invalid set the credentials to null and navigate user to login page
            api.dispatch(logOut())
        }
    }
    return result
}

export const rootAPI = createApi({
    reducerPath: 'api',
    tagTypes: ['User', 'Project', 'Task', 'CurrentUser'],
    baseQuery: baseQueryWithReauth,
    endpoints: builder => ({})
})
