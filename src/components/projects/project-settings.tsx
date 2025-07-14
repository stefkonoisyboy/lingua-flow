"use client";

import { useState, useEffect } from "react";
import { Box, Alert } from "@mui/material";
import { ProjectSettingsContainer } from "@/styles/projects/project-settings.styles";
import { ProjectDetailsForm } from "./settings/project-details-form";
import { ProjectLanguages } from "./settings/project-languages";

interface ProjectSettingsProps {
  projectId: string;
  initialName: string;
  initialDescription?: string;
  languages: {
    language_id: string;
    is_default: boolean;
    languages: {
      id: string;
      name: string;
      code: string;
      flag_url: string | null;
      is_rtl: boolean;
    };
  }[];
}

export function ProjectSettings({
  projectId,
  initialName,
  initialDescription = "",
  languages,
}: ProjectSettingsProps) {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
  };

  return (
    <ProjectSettingsContainer>
      {(successMessage || errorMessage) && (
        <Box sx={{ mb: 3 }}>
          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage("")}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}
        </Box>
      )}

      <ProjectDetailsForm
        projectId={projectId}
        initialName={initialName}
        initialDescription={initialDescription}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      <ProjectLanguages
        projectId={projectId}
        languages={languages}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </ProjectSettingsContainer>
  );
}
