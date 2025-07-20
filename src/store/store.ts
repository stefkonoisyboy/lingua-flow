import { configureStore } from "@reduxjs/toolkit";
import translationsReducer from "./slices/translations.slice";
import projectTabsReducer from "./slices/project-tabs.slice";
import selectedLanguageReducer from "./slices/selected-language.slice";
import conflictResolutionReducer from "./slices/conflict-resolution.slice";

export const store = configureStore({
  reducer: {
    translations: translationsReducer,
    projectTabs: projectTabsReducer,
    selectedLanguage: selectedLanguageReducer,
    conflictResolution: conflictResolutionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
