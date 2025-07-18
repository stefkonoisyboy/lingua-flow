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
  },
});

export const { setConflicts, clearConflicts, setStatus, setError } =
  conflictResolutionSlice.actions;

export const selectConflicts = (state: {
  conflictResolution: ConflictResolutionState;
}) => state.conflictResolution.conflicts;

export default conflictResolutionSlice.reducer;
