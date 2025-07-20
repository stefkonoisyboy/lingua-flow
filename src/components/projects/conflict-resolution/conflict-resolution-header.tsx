"use client";

import {
  Button,
  Typography,
  Box,
  Chip,
  Stack,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

interface ConflictResolutionHeaderProps {
  success: boolean;
  totalConflicts: number;
  resolvedCount: number;
  unresolvedCount: number;
  autoExport: boolean;
  setAutoExport: (value: boolean) => void;
  handleKeepAll: (type: "linguaflow" | "github") => void;
  handleApplyResolutions: () => void;
  isPending: boolean;
  disabled: boolean;
}

export function ConflictResolutionHeader({
  success,
  totalConflicts,
  resolvedCount,
  unresolvedCount,
  autoExport,
  setAutoExport,
  handleKeepAll,
  handleApplyResolutions,
  isPending,
  disabled,
}: ConflictResolutionHeaderProps) {
  return (
    <Box mb={3}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {success ? "Conflicts Resolved" : "Resolve Conflicts"}
      </Typography>
      <Typography color="text.secondary" mb={2}>
        {success
          ? "All conflicts have been resolved and changes have been applied."
          : "Review and resolve differences between LinguaFlow and your repository."}
      </Typography>

      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Chip
          label={isPending ? "Loading..." : `${totalConflicts} Total Conflicts`}
          color="error"
        />
        <Chip
          label={isPending ? "Loading..." : `${resolvedCount} Resolved`}
          color="success"
        />
        <Chip
          label={isPending ? "Loading..." : `${unresolvedCount} Unresolved`}
        />
      </Box>

      <Stack direction="row" spacing={2} mb={2}>
        <Button
          variant="outlined"
          onClick={() => handleKeepAll("linguaflow")}
          disabled={disabled}
        >
          Keep All LinguaFlow Versions
        </Button>

        <Button
          variant="outlined"
          onClick={() => handleKeepAll("github")}
          disabled={disabled}
        >
          Keep All GitHub Versions
        </Button>

        <Button
          variant="contained"
          color="primary"
          disabled={disabled || resolvedCount === 0}
          loading={isPending}
          onClick={handleApplyResolutions}
        >
          {isPending
            ? "Applying..."
            : `Apply Resolutions${
                autoExport ? " & Export" : ""
              } (${resolvedCount})`}
        </Button>
      </Stack>

      <Box mb={2}>
        <FormControlLabel
          control={
            <Checkbox
              checked={autoExport}
              onChange={(e) => setAutoExport(e.target.checked)}
              disabled={disabled}
            />
          }
          label="Export to GitHub automatically after resolving conflicts"
        />
      </Box>
    </Box>
  );
}
