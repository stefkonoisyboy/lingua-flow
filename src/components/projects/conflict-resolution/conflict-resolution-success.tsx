"use client";

import { Button, Typography, Box } from "@mui/material";
import { StyledCheckCircleIcon } from "@/styles/projects/conflict-resolution.styles";

interface ConflictResolutionSuccessProps {
  success: boolean;
  exportStatus: "idle" | "exporting" | "completed" | "error";
  autoExport: boolean;
  pullRequestUrl: string | null;
  noChangesDetected: boolean;
  exportError: string | null;
  handleExportToGitHub: () => void;
  handleRetryExport: () => void;
  isExportPending: boolean;
}

export function ConflictResolutionSuccess({
  success,
  exportStatus,
  autoExport,
  pullRequestUrl,
  noChangesDetected,
  exportError,
  handleExportToGitHub,
  handleRetryExport,
  isExportPending,
}: ConflictResolutionSuccessProps) {
  if (!success) return null;

  return (
    <Box textAlign="center" mt={4}>
      <StyledCheckCircleIcon color="success" />
      <Typography variant="h6" mt={2}>
        {exportStatus === "idle" &&
          autoExport &&
          "Resolutions applied successfully!"}
        {exportStatus === "idle" &&
          !autoExport &&
          "Resolutions applied locally!"}
        {exportStatus === "exporting" && "Exporting to GitHub..."}
        {exportStatus === "completed" &&
          pullRequestUrl &&
          "Sync completed successfully!"}
        {exportStatus === "completed" &&
          noChangesDetected &&
          "No changes to export!"}
        {exportStatus === "error" && "Export failed"}
      </Typography>

      {exportStatus === "exporting" && (
        <Typography color="text.secondary" mt={1}>
          Creating pull request...
        </Typography>
      )}

      {exportStatus === "completed" && noChangesDetected && (
        <Typography color="text.secondary" mt={1}>
          All selected translations were already up to date with GitHub.
        </Typography>
      )}

      {exportStatus === "idle" && !autoExport && (
        <Box mt={2}>
          <Typography color="text.secondary" mb={2}>
            Resolutions applied locally. Export to GitHub when ready.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExportToGitHub}
            disabled={isExportPending}
          >
            {isExportPending ? "Exporting..." : "Export to GitHub (if changes)"}
          </Button>
        </Box>
      )}

      {exportStatus === "completed" && pullRequestUrl && (
        <Box mt={2}>
          <Typography color="text.secondary" mb={1}>
            Pull request created successfully!
          </Typography>
          <Button
            variant="outlined"
            href={pullRequestUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Pull Request
          </Button>
        </Box>
      )}

      {exportStatus === "error" && (
        <Box mt={2}>
          <Typography color="error" mb={2}>
            {exportError}
          </Typography>
          <Button
            variant="outlined"
            onClick={handleRetryExport}
            disabled={isExportPending}
          >
            Retry Export
          </Button>
        </Box>
      )}
    </Box>
  );
}
