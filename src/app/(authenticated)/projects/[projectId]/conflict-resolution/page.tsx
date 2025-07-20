"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  selectConflicts,
  clearResolvedConflicts,
  Conflict,
} from "@/store/slices/conflict-resolution.slice";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ConflictResolutionHeader } from "@/components/projects/conflict-resolution/conflict-resolution-header";
import { ConflictResolutionSuccess } from "@/components/projects/conflict-resolution/conflict-resolution-success";
import { ConflictResolutionList } from "@/components/projects/conflict-resolution/conflict-resolution-list";
import { StyledMainCheckCircleIcon } from "@/styles/projects/conflict-resolution.styles";

// Validation schema for manual values
const validationSchema = Yup.object().shape({
  resolutions: Yup.object().test(
    "manual-values-required",
    "Manual values are required when manual option is selected",
    function (value) {
      if (!value) {
        return true;
      }

      const resolutions = value as Record<
        string,
        Record<string, { type: string; manualValue: string }>
      >;

      for (const langKey in resolutions) {
        const langResolutions = resolutions[langKey];

        for (const posKey in langResolutions) {
          const resolution = langResolutions[posKey];

          if (resolution.type === "manual" && !resolution.manualValue?.trim()) {
            return this.createError({
              path: `resolutions.${langKey}.${posKey}.manualValue`,
              message: "Manual value is required",
            });
          }
        }
      }
      return true;
    }
  ),
});

export default function ConflictResolutionPage() {
  const { data: availableLanguages } = trpc.languages.getLanguages.useQuery();

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

  // Transform resolutions to Formik format
  const initialValues = {
    resolutions: {} as Record<
      string,
      Record<number, { type: string; manualValue: string }>
    >,
  };

  // Flatten all conflicts for summary
  const allConflicts = conflicts ? Object.values(conflicts).flat() : [];
  const totalConflicts = allConflicts.length;

  const handleApplyResolutions = async (
    formValues: typeof initialValues,
    resetForm: () => void
  ) => {
    if (!conflicts) {
      return;
    }

    try {
      // Prepare all resolutions for all languages in one request
      const allResolutions = Object.entries(conflicts)
        .map(([lang, conflictArr]) => {
          const langRes = formValues.resolutions[lang];
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

            const resolution = res as { type: string; manualValue: string };

            if (resolution.type === "linguaflow") {
              resolvedValue = conflict.linguaFlowValue || "";
            } else if (resolution.type === "github") {
              resolvedValue = conflict.githubValue || "";
            } else if (resolution.type === "manual") {
              resolvedValue = resolution.manualValue;
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
        dispatch(clearResolvedConflicts(formValues.resolutions));
        setSuccess(true);

        // Start export to GitHub if auto-export is enabled
        if (autoExport) {
          await handleExportToGitHub();
        }

        resetForm();
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

  if (
    !success &&
    (!conflicts || Object.values(conflicts).every((arr) => arr.length === 0))
  ) {
    return (
      <Box textAlign="center" mt={8}>
        <StyledMainCheckCircleIcon color="success" />
        <Typography variant="h5" mt={2}>
          No conflicts detected!
        </Typography>
        <Typography color="text.secondary">
          Your translations are in sync with GitHub.
        </Typography>
      </Box>
    );
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values, { resetForm }) =>
        handleApplyResolutions(values, resetForm)
      }
      enableReinitialize
    >
      {({ submitForm, isSubmitting, values, setFieldValue }) => {
        // Calculate resolved count from Formik values
        const resolvedCount = Object.values(
          values.resolutions as Record<
            string,
            Record<number, { type: string; manualValue: string }>
          >
        ).reduce(
          (
            sum: number,
            langRes: Record<number, { type: string; manualValue: string }>
          ) => {
            return (
              sum +
              Object.values(langRes).filter(
                (resolution) =>
                  resolution.type === "linguaflow" ||
                  resolution.type === "github" ||
                  (resolution.type === "manual" &&
                    Boolean(resolution.manualValue) &&
                    resolution.manualValue.trim() !== "")
              ).length
            );
          },
          0
        );

        const unresolvedCount = totalConflicts - resolvedCount;

        const handleKeepAll = (type: "linguaflow" | "github") => {
          if (!conflicts) {
            return;
          }

          Object.entries(conflicts).forEach(([lang, conflictArr]) => {
            conflictArr.forEach((_, i) => {
              setFieldValue(`resolutions.${lang}.${i}.type`, type);
              setFieldValue(`resolutions.${lang}.${i}.manualValue`, "");
            });
          });
        };

        return (
          <>
            <ConflictResolutionHeader
              success={success}
              totalConflicts={totalConflicts}
              resolvedCount={resolvedCount}
              unresolvedCount={unresolvedCount}
              autoExport={autoExport}
              setAutoExport={setAutoExport}
              handleKeepAll={handleKeepAll}
              handleApplyResolutions={submitForm}
              isPending={isSubmitting}
              disabled={success || isSubmitting}
            />

            <ConflictResolutionSuccess
              success={success}
              exportStatus={exportStatus}
              autoExport={autoExport}
              pullRequestUrl={pullRequestUrl}
              noChangesDetected={noChangesDetected}
              exportError={exportError}
              handleExportToGitHub={handleExportToGitHub}
              handleRetryExport={handleRetryExport}
              isExportPending={exportTranslations.isPending}
            />

            <ConflictResolutionList
              conflicts={conflicts}
              availableLanguages={availableLanguages}
              success={success}
            />
          </>
        );
      }}
    </Formik>
  );
}
