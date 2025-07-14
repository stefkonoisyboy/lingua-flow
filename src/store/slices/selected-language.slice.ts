import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface SelectedLanguageState {
  selectedLanguageId: string;
}

const initialState: SelectedLanguageState = {
  selectedLanguageId: "",
};

export const selectedLanguageSlice = createSlice({
  name: "selectedLanguage",
  initialState,
  reducers: {
    setSelectedLanguageId: (state, action: PayloadAction<string>) => {
      state.selectedLanguageId = action.payload;
    },
    resetSelectedLanguageId: (state) => {
      state.selectedLanguageId = "";
    },
  },
});

export const { setSelectedLanguageId, resetSelectedLanguageId } =
  selectedLanguageSlice.actions;

export const selectSelectedLanguageId = (state: RootState) =>
  state.selectedLanguage.selectedLanguageId;

export default selectedLanguageSlice.reducer;
