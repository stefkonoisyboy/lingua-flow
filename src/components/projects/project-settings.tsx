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
import { ImportExport } from "./translations/import-export";

export function ProjectSettings() {
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

      <ProjectDetailsForm onSuccess={handleSuccess} onError={handleError} />

      <ProjectLanguages onSuccess={handleSuccess} onError={handleError} />

      <IntegrationsList onSuccess={handleSuccess} onError={handleError} />

      <ImportExport />
    </ProjectSettingsContainer>
  );
}
