import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type ProjectTab = "translations" | "settings" | "collaborators";

interface ProjectTabsState {
  activeTab: ProjectTab;
}

const initialState: ProjectTabsState = {
  activeTab: "translations",
};

export const projectTabsSlice = createSlice({
  name: "projectTabs",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<ProjectTab>) => {
      state.activeTab = action.payload;
    },
  },
});

export const { setActiveTab } = projectTabsSlice.actions;

export const selectActiveTab = (state: RootState) =>
  state.projectTabs.activeTab;

export default projectTabsSlice.reducer;
