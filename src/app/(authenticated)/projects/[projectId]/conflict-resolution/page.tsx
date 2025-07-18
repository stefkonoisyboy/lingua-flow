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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { selectConflicts } from "@/store/slices/conflict-resolution.slice";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Conflict } from "@/store/slices/conflict-resolution.slice";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";

export default function ConflictResolutionPage() {
  const { data: availableLanguages } = trpc.languages.getLanguages.useQuery();

  // State: { [lang]: { [position]: 'linguaflow' | 'github' | 'manual', manualValue: string } }
  const [resolutions, setResolutions] = useState<
    Record<string, Record<number, { type: string; manualValue: string }>>
  >({});

  const theme = useTheme();

  const conflicts = useSelector(selectConflicts) as Record<
    string,
    Conflict[]
  > | null;

  const resolveConflicts = trpc.integrations.resolveConflicts.useMutation();
  const [success, setSuccess] = useState(false);

  const params = useParams();
  const projectId = params.projectId as string;

  if (!conflicts || Object.values(conflicts).every((arr) => arr.length === 0)) {
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
  const allConflicts = Object.values(conflicts).flat();
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
      for (const [lang, conflictArr] of Object.entries(conflicts)) {
        const langRes = resolutions[lang];

        if (!langRes) {
          continue;
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

        if (payload.length > 0) {
          const languageId = availableLanguages?.find(
            (l) => l.code === lang
          )?.id;

          if (!languageId) {
            continue;
          }

          await resolveConflicts.mutateAsync({
            projectId,
            languageId,
            resolutions: payload,
          });
        }
      }

      setSuccess(true);
    } catch {
      setSuccess(false);
    }
  };

  return (
    <>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Resolve Conflicts
        </Typography>
        <Typography color="text.secondary" mb={2}>
          Review and resolve differences between LinguaFlow and your repository.
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
          >
            Keep All LinguaFlow Versions
          </Button>
          <Button variant="outlined" onClick={() => handleKeepAll("github")}>
            Keep All GitHub Versions
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={resolvedCount === 0}
            onClick={handleApplyResolutions}
          >
            Apply Resolutions ({resolvedCount})
          </Button>
        </Stack>
      </Box>

      {success && (
        <Box textAlign="center" mt={4}>
          <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
          <Typography variant="h6" mt={2}>
            Resolutions applied successfully!
          </Typography>
        </Box>
      )}

      {Object.entries(conflicts)
        .filter(([, conflictArr]) => conflictArr.length > 0)
        .map(([lang, conflictArr]) => (
          <Accordion key={lang} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                {availableLanguages?.find((l) => l.code === lang)?.name || lang}{" "}
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
                    bgcolor={theme.palette.customBackground.conflictResolution}
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
