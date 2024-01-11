import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
    name: "user",
    initialState: {
        id: null,
        formData: null,
        userData: null
    },
    reducers: {
        setUserData: (state, action) => {
            // const { id } = action.payload;
            // state.id = id;
            state.userData = action.payload;
        },
        logoutUser: (state, action) => {
            state.id = null;
            state.formData = null;
            state.userData = null;
        },
        setUserFormData: (state, action) => {
            state.formData = action.payload.data;
        },
    }
});

export const {
    setUserData,
    setUserFormData,
    logoutUser
} = userSlice.actions;

export default userSlice.reducer;

// selectors for the user slice, must be used with useSelector hook from redux toolkit
export const getUser = (state) => state.user.userData;
export const getUserID = (state) => state.user.id;
export const getUserFormData = (state) => state.user.formData;
