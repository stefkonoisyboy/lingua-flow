import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NewTranslationKey {
  key: string;
  description?: string;
  translations: Record<string, string>; // languageId -> content
}

interface TranslationsState {
  newKey: NewTranslationKey | null;
  isAddingKey: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

const initialState: TranslationsState = {
  newKey: null,
  isAddingKey: false,
  error: null,
  hasUnsavedChanges: false,
};

export const translationsSlice = createSlice({
  name: "translations",
  initialState,
  reducers: {
    startAddingKey: (state) => {
      state.isAddingKey = true;
      state.newKey = {
        key: "",
        translations: {},
      };
    },
    cancelAddingKey: (state) => {
      state.isAddingKey = false;
      state.newKey = null;
      state.error = null;
    },
    updateNewKeyField: (
      state,
      action: PayloadAction<{ field: "key" | "description"; value: string }>
    ) => {
      if (state.newKey && action.payload.field) {
        state.newKey[action.payload.field] = action.payload.value;
        state.hasUnsavedChanges = true;
      }
    },
    updateNewTranslation: (
      state,
      action: PayloadAction<{ languageId: string; content: string }>
    ) => {
      if (state.newKey) {
        state.newKey.translations[action.payload.languageId] =
          action.payload.content;
        state.hasUnsavedChanges = true;
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearUnsavedChanges: (state) => {
      state.hasUnsavedChanges = false;
    },
  },
});

export const {
  startAddingKey,
  cancelAddingKey,
  updateNewKeyField,
  updateNewTranslation,
  setError,
  clearUnsavedChanges,
} = translationsSlice.actions;

// Selectors
export const selectIsAddingKey = (state: { translations: TranslationsState }) =>
  state.translations.isAddingKey;

export const selectNewKey = (state: { translations: TranslationsState }) =>
  state.translations.newKey;

export const selectError = (state: { translations: TranslationsState }) =>
  state.translations.error;

export const selectHasUnsavedChanges = (state: {
  translations: TranslationsState;
}) => state.translations.hasUnsavedChanges;

export default translationsSlice.reducer;
