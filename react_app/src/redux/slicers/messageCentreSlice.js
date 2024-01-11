import { createSlice } from "@reduxjs/toolkit";
import { MESSAGE_LIST_TYPES } from "../../providers/MessageListTypeContextProvider";

const messageCentreSlicer = createSlice({
    name: 'MessageCentre',
    initialState: {
        listType: MESSAGE_LIST_TYPES.PROJECT.label,
        messageData: null,
    },
    reducers: {
        showMessageCentreListType: (name, action) => {
            return action.payload;
        },
        getMessageData: (state, action) => {
            state.messageData = action.payload
        }
    }
});

export const { showMessageCentreListType, getMessageData } = messageCentreSlicer.actions;
export default messageCentreSlicer.reducer;

export const selectMessageCentre = (state) => state;
