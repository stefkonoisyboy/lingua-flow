import { configureStore } from "@reduxjs/toolkit";
import translationsReducer from "./slices/translations.slice";
import projectTabsReducer from "./slices/project-tabs.slice";

export const store = configureStore({
  reducer: {
    translations: translationsReducer,
    projectTabs: projectTabsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
