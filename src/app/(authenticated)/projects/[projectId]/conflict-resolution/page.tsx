"use client";

import { useState } from "react";
import {
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  TextField,
  Chip,
  Stack,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material/styles";
import {
  selectConflicts,
  clearResolvedConflicts,
  Conflict,
} from "@/store/slices/conflict-resolution.slice";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function ConflictResolutionPage() {
  const { data: availableLanguages } = trpc.languages.getLanguages.useQuery();

  // State: { [lang]: { [position]: 'linguaflow' | 'github' | 'manual', manualValue: string } }
  const [resolutions, setResolutions] = useState<
    Record<string, Record<number, { type: string; manualValue: string }>>
  >({});

  const theme = useTheme();

  const conflicts = useAppSelector(selectConflicts) as Record<
    string,
    Conflict[]
  > | null;

  const dispatch = useAppDispatch();

  const params = useParams();
  const projectId = params.projectId as string;

  const resolveConflicts = trpc.integrations.resolveConflicts.useMutation();
  const exportTranslations = trpc.integrations.exportTranslations.useMutation();

  const { data: integration } =
    trpc.integrations.getProjectIntegration.useQuery({ projectId });

  const [success, setSuccess] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "exporting" | "completed" | "error"
  >("idle");
  const [pullRequestUrl, setPullRequestUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [autoExport, setAutoExport] = useState(true);
  const [noChangesDetected, setNoChangesDetected] = useState(false);

  if (
    !success &&
    (!conflicts || Object.values(conflicts).every((arr) => arr.length === 0))
  ) {
    return (
      <Box textAlign="center" mt={8}>
        <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
        <Typography variant="h5" mt={2}>
          No conflicts detected!
        </Typography>
        <Typography color="text.secondary">
          Your translations are in sync with GitHub.
        </Typography>
      </Box>
    );
  }

  // Flatten all conflicts for summary
  const allConflicts = conflicts ? Object.values(conflicts).flat() : [];
  const totalConflicts = allConflicts.length;

  const resolvedCount = Object.values(resolutions).reduce(
    (sum, langRes) => sum + Object.keys(langRes).length,
    0
  );

  const unresolvedCount = totalConflicts - resolvedCount;

  const handleResolutionChange = (
    lang: string,
    pos: number,
    type: string,
    manualValue = ""
  ) => {
    setResolutions((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [pos]: { type, manualValue },
      },
    }));
  };

  const handleKeepAll = (type: "linguaflow" | "github") => {
    const newRes: typeof resolutions = {};

    if (!conflicts) {
      return;
    }

    Object.entries(conflicts).forEach(([lang, conflictArr]) => {
      newRes[lang] = {};

      conflictArr.forEach((_, i) => {
        newRes[lang][i] = { type, manualValue: "" };
      });
    });

    setResolutions(newRes);
  };

  const handleApplyResolutions = async () => {
    if (!conflicts) {
      return;
    }

    try {
      // Prepare all resolutions for all languages in one request
      const allResolutions = Object.entries(conflicts)
        .map(([lang, conflictArr]) => {
          const langRes = resolutions[lang];
          if (!langRes) {
            return null;
          }

          const languageId = availableLanguages?.find(
            (l) => l.code === lang
          )?.id;

          if (!languageId) {
            return null;
          }

          const payload = Object.entries(langRes).map(([idx, res]) => {
            const conflict = conflictArr[Number(idx)];
            let resolvedValue = "";

            if (res.type === "linguaflow") {
              resolvedValue = conflict.linguaFlowValue || "";
            } else if (res.type === "github") {
              resolvedValue = conflict.githubValue || "";
            } else if (res.type === "manual") {
              resolvedValue = res.manualValue;
            }

            return {
              key: conflict.linguaFlowKey || conflict.githubKey || "",
              resolvedValue,
            };
          });

          return {
            languageId,
            resolutions: payload,
          };
        })
        .filter(
          (
            item
          ): item is {
            languageId: string;
            resolutions: { key: string; resolvedValue: string }[];
          } => item !== null
        );

      if (allResolutions.length > 0) {
        await resolveConflicts.mutateAsync({
          projectId,
          resolutions: allResolutions,
        });

        // Clear resolved conflicts from Redux state
        dispatch(clearResolvedConflicts(resolutions));

        // Clear resolved resolutions from local state
        setResolutions({});

        setSuccess(true);

        // Start export to GitHub if auto-export is enabled
        if (autoExport) {
          await handleExportToGitHub();
        }
      }
    } catch {
      setSuccess(false);
    }
  };

  const handleExportToGitHub = async () => {
    if (!integration?.config) {
      setExportError("No integration configuration found");
      setExportStatus("error");
      return;
    }

    const config = integration.config as { repository: string; branch: string };

    try {
      setExportStatus("exporting");
      setExportError(null);
      setNoChangesDetected(false);

      const result = await exportTranslations.mutateAsync({
        projectId,
        repository: config.repository,
        baseBranch: config.branch,
      });

      if (result.pullRequestUrl) {
        setPullRequestUrl(result.pullRequestUrl);
        setNoChangesDetected(false);
      } else {
        setNoChangesDetected(true);
      }

      setExportStatus("completed");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed");
      setExportStatus("error");
    }
  };

  const handleRetryExport = () => {
    handleExportToGitHub();
  };

  return (
    <>
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
          <Chip label={`${totalConflicts} Total Conflicts`} color="error" />
          <Chip label={`${resolvedCount} Resolved`} color="success" />
          <Chip label={`${unresolvedCount} Unresolved`} />
        </Box>

        <Stack direction="row" spacing={2} mb={2}>
          <Button
            variant="outlined"
            onClick={() => handleKeepAll("linguaflow")}
            disabled={success}
          >
            Keep All LinguaFlow Versions
          </Button>

          <Button
            variant="outlined"
            onClick={() => handleKeepAll("github")}
            disabled={success}
          >
            Keep All GitHub Versions
          </Button>

          <Button
            variant="contained"
            color="primary"
            disabled={
              resolvedCount === 0 ||
              resolveConflicts.isPending ||
              exportTranslations.isPending
            }
            loading={resolveConflicts.isPending || exportTranslations.isPending}
            onClick={handleApplyResolutions}
          >
            {resolveConflicts.isPending || exportTranslations.isPending
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
                disabled={
                  success ||
                  resolveConflicts.isPending ||
                  exportTranslations.isPending
                }
              />
            }
            label="Export to GitHub automatically after resolving conflicts"
          />
        </Box>
      </Box>

      {success && (
        <Box textAlign="center" mt={4}>
          <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
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
                disabled={exportTranslations.isPending}
              >
                {exportTranslations.isPending
                  ? "Exporting..."
                  : "Export to GitHub (if changes)"}
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
                disabled={exportTranslations.isPending}
              >
                Retry Export
              </Button>
            </Box>
          )}
        </Box>
      )}

      {conflicts &&
        Object.entries(conflicts)
          .filter(([, conflictArr]) => conflictArr.length > 0)
          .map(([lang, conflictArr]) => (
            <Accordion key={lang} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  {availableLanguages?.find((l) => l.code === lang)?.name ||
                    lang}{" "}
                  <Chip
                    label={`${conflictArr.length} conflicts`}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                {conflictArr.map((conf, i) => {
                  const res = resolutions[lang]?.[i];
                  return (
                    <Box
                      key={i}
                      mb={3}
                      p={2}
                      borderRadius={2}
                      bgcolor={
                        theme.palette.customBackground.conflictResolution
                      }
                    >
                      <Typography variant="subtitle2" color="primary" mb={1}>
                        {conf.linguaFlowKey || conf.githubKey}
                      </Typography>
                      <Box display="flex" gap={2}>
                        <Box flex={1}>
                          <Radio
                            checked={res?.type === "linguaflow"}
                            onChange={() =>
                              handleResolutionChange(lang, i, "linguaflow")
                            }
                            disabled={success}
                          />
                          <Typography variant="caption">
                            LinguaFlow Version
                          </Typography>
                          <TextField
                            value={conf.linguaFlowValue || ""}
                            fullWidth
                            multiline
                            minRows={2}
                            slotProps={{
                              input: {
                                readOnly: true,
                              },
                            }}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                        <Box flex={1}>
                          <Radio
                            checked={res?.type === "github"}
                            onChange={() =>
                              handleResolutionChange(lang, i, "github")
                            }
                            disabled={success}
                          />
                          <Typography variant="caption">
                            GitHub Version
                          </Typography>
                          <TextField
                            value={conf.githubValue || ""}
                            fullWidth
                            multiline
                            minRows={2}
                            slotProps={{
                              input: {
                                readOnly: true,
                              },
                            }}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                        <Box flex={1}>
                          <Radio
                            checked={res?.type === "manual"}
                            onChange={() =>
                              handleResolutionChange(
                                lang,
                                i,
                                "manual",
                                res?.manualValue || ""
                              )
                            }
                            disabled={success}
                          />
                          <Typography variant="caption">
                            Manual / Merged Version
                          </Typography>
                          <TextField
                            value={res?.manualValue || ""}
                            onChange={(e) =>
                              handleResolutionChange(
                                lang,
                                i,
                                "manual",
                                e.target.value
                              )
                            }
                            fullWidth
                            multiline
                            minRows={2}
                            disabled={success}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </AccordionDetails>
            </Accordion>
          ))}
    </>
  );
}
