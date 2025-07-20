"use client";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material/styles";
import { Conflict } from "@/store/slices/conflict-resolution.slice";
import { useFormikContext } from "formik";
import {
  StyledConflictChip,
  StyledTextField,
} from "@/styles/projects/conflict-resolution.styles";

interface ConflictResolutionListProps {
  conflicts: Record<string, Conflict[]> | null;
  availableLanguages:
    | Array<{ id: string; name: string; code: string }>
    | undefined;
  success: boolean;
}

export function ConflictResolutionList({
  conflicts,
  availableLanguages,
  success,
}: ConflictResolutionListProps) {
  const theme = useTheme();
  const {
    values,
    setFieldValue,
    errors,
    touched,
    setFieldTouched,
    setFieldError,
  } = useFormikContext<{
    resolutions: Record<
      string,
      Record<number, { type: string; manualValue: string }>
    >;
  }>();

  if (!conflicts) {
    return null;
  }

  return (
    <>
      {Object.entries(conflicts)
        .filter(([, conflictArr]) => conflictArr.length > 0)
        .map(([lang, conflictArr]) => (
          <Accordion key={lang} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                {availableLanguages?.find((l) => l.code === lang)?.name || lang}{" "}
                <StyledConflictChip
                  label={`${conflictArr.length} conflicts`}
                  size="small"
                />
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              {conflictArr.map((conf, i) => {
                const fieldPath = `resolutions.${lang}.${i}`;
                const currentValue = values.resolutions[lang]?.[i];
                const fieldError = errors.resolutions?.[lang]?.[i];
                const fieldTouched = touched.resolutions?.[lang]?.[i];

                const handleRadioChange = (type: string) => {
                  setFieldValue(`${fieldPath}.type`, type);

                  if (type !== "manual") {
                    setFieldValue(`${fieldPath}.manualValue`, "");

                    // Clear the touched state of the manual field when switching away from manual
                    setFieldTouched(`${fieldPath}.manualValue`, false);

                    // Clear any validation errors for the manual field
                    setFieldError(`${fieldPath}.manualValue`, undefined);
                  }
                };

                const handleManualValueChange = (value: string) => {
                  setFieldValue(`${fieldPath}.manualValue`, value);
                };

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
                          checked={currentValue?.type === "linguaflow"}
                          onChange={() => handleRadioChange("linguaflow")}
                          disabled={success}
                        />
                        <Typography variant="caption">
                          LinguaFlow Version
                        </Typography>
                        <StyledTextField
                          value={conf.linguaFlowValue || ""}
                          fullWidth
                          multiline
                          minRows={2}
                          slotProps={{
                            input: {
                              readOnly: true,
                            },
                          }}
                        />
                      </Box>
                      <Box flex={1}>
                        <Radio
                          checked={currentValue?.type === "github"}
                          onChange={() => handleRadioChange("github")}
                          disabled={success}
                        />
                        <Typography variant="caption">
                          GitHub Version
                        </Typography>
                        <StyledTextField
                          value={conf.githubValue || ""}
                          fullWidth
                          multiline
                          minRows={2}
                          slotProps={{
                            input: {
                              readOnly: true,
                            },
                          }}
                        />
                      </Box>
                      <Box flex={1}>
                        <Radio
                          checked={currentValue?.type === "manual"}
                          onChange={() => handleRadioChange("manual")}
                          disabled={success}
                        />
                        <Typography variant="caption">
                          Manual / Merged Version
                        </Typography>
                        <StyledTextField
                          value={currentValue?.manualValue || ""}
                          onChange={(e) =>
                            handleManualValueChange(e.target.value)
                          }
                          onBlur={() =>
                            setFieldTouched(`${fieldPath}.manualValue`)
                          }
                          fullWidth
                          multiline
                          minRows={2}
                          disabled={success}
                          error={
                            currentValue?.type === "manual" &&
                            fieldTouched?.manualValue &&
                            !!fieldError?.manualValue
                          }
                          helperText={
                            currentValue?.type === "manual" &&
                            fieldTouched?.manualValue &&
                            fieldError?.manualValue
                          }
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
