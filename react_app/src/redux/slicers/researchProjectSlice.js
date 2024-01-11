import { createSlice } from "@reduxjs/toolkit";

const researchProjectSlice = createSlice({
    name: 'ResearchProject',
    initialState: {
        researchStudyTeamData: null,
    },
    reducers: {
        getResearchProjectData: (state, action) => {
            state.messageData = action.payload;
        }
    }
});

export const { getResearchProjectData } = researchProjectSlice.actions;
export default researchProjectSlice.reducer;

export const selectResearchProject = (state) => state;
