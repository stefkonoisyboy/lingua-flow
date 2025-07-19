import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Conflict = {
  linguaFlowKey: string | undefined;
  linguaFlowValue: string | undefined;
  githubKey: string | undefined;
  githubValue: string | undefined;
  position: number;
};

export interface ConflictResolutionState {
  conflicts: Record<string, Conflict[]> | null;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
}

const initialState: ConflictResolutionState = {
  conflicts: null,
  status: "idle",
  error: null,
};

const conflictResolutionSlice = createSlice({
  name: "conflictResolution",
  initialState,
  reducers: {
    setConflicts(state, action: PayloadAction<Record<string, Conflict[]>>) {
      state.conflicts = action.payload;
      state.status = "success";
      state.error = null;
    },
    clearConflicts(state) {
      state.conflicts = null;
      state.status = "idle";
      state.error = null;
    },
    setStatus(state, action: PayloadAction<ConflictResolutionState["status"]>) {
      state.status = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.status = "error";
    },
    clearResolvedConflicts(
      state,
      action: PayloadAction<
        Record<string, Record<number, { type: string; manualValue: string }>>
      >
    ) {
      if (!state.conflicts) {
        return;
      }

      const resolutions = action.payload;

      // Remove resolved conflicts from each language
      Object.entries(resolutions).forEach(([lang, langResolutions]) => {
        if (state.conflicts && state.conflicts[lang]) {
          // Get indices of resolved conflicts (in reverse order to avoid index shifting)
          const resolvedIndices = Object.keys(langResolutions)
            .map(Number)
            .sort((a, b) => b - a);

          // Remove resolved conflicts from the array
          resolvedIndices.forEach((index) => {
            state.conflicts![lang].splice(index, 1);
          });

          // Remove language entry if no conflicts remain
          if (state.conflicts[lang].length === 0) {
            delete state.conflicts[lang];
          }
        }
      });
    },
  },
});

export const {
  setConflicts,
  clearConflicts,
  setStatus,
  setError,
  clearResolvedConflicts,
} = conflictResolutionSlice.actions;

export const selectConflicts = (state: {
  conflictResolution: ConflictResolutionState;
}) => state.conflictResolution.conflicts;

export default conflictResolutionSlice.reducer;
