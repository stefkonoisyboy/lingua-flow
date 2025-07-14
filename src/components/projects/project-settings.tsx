"use client";

import { useState, useEffect } from "react";
import { Alert } from "@mui/material";
import {
  ProjectSettingsContainer,
  AlertContainer,
} from "@/styles/projects/project-settings.styles";
import { ProjectDetailsForm } from "./settings/project-details-form";
import { ProjectLanguages } from "./settings/project-languages";
import { IntegrationsList } from "./integrations/integrations-list";

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
        <AlertContainer>
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
        </AlertContainer>
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

      <IntegrationsList
        projectId={projectId}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </ProjectSettingsContainer>
  );
}
