import { configureStore } from "@reduxjs/toolkit";
import { showMessageCentreListType } from "./slicers/messageCentreSlice.js";
import { rootAPI } from "./services/rootAPI.js";
import authReducer from "./slicers/authSlice.js";
import adminPanelSlice from "./slicers/adminPanelSlice.js";
import userSlice from "./slicers/userSlice";

export const store = configureStore({
    reducer: {
        [rootAPI.reducerPath]: rootAPI.reducer,
        messageCentreListType: showMessageCentreListType,
        auth: authReducer,
        adminPanel: adminPanelSlice,
        user: userSlice,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(rootAPI.middleware),
    devTools: true,
});

export default store;
