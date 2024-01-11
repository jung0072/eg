import { createSlice } from '@reduxjs/toolkit';
import { Constants } from '../../components/utils/';

const initialState = {
  adminPanelComponent: Constants.ADMIN_PANEL_COMPONENT
};

const adminPanelSlice = createSlice({
	name: 'adminPanel',
	initialState,
	reducers: {
		setAdminPanelValue: (state, action) => {
			const { id, value } = action.payload;
			const index = state.adminPanelComponent.findIndex(
				(item) => item.id === id
			);
			state.adminPanelComponent[index].value = value;
		},
	},
});

export const { setAdminPanelValue } = adminPanelSlice.actions;

export default adminPanelSlice.reducer;
