import { createSlice } from "@reduxjs/toolkit";

// creates the slice to set the credentials when received from the api -> login and refresh token 
const authSlice = createSlice({
	name: "auth",
	initialState: { username: null, token: {access: null, refresh: null} },
	reducers: {
		setCredentials: (state, action) => {
			// set the token and user name here
			const token = {
				access: action.payload.access,
				refresh: action.payload.refresh,
			};

			const { username } = action.payload;

			state.username = username;
			state.token = token;

			// set the token in session
			if(token) {				
				sessionStorage.setItem("access", token.access)
				sessionStorage.setItem("refresh", token.refresh)
			}
		},
		logOut: (state, action) => {
			state.username = null;
			state.token.access = null;
			state.token.refresh = null;
			sessionStorage.removeItem("access")
			sessionStorage.removeItem("refresh")
		},
	},
});

export const { setCredentials, logOut } = authSlice.actions;

export default authSlice.reducer;

export const selectUser = (state) => state.auth.username;
export const selectToken = (state) => state.auth.token;
