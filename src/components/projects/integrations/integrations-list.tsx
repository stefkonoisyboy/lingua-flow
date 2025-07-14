"use client";

import { Typography } from "@mui/material";
import {
  IntegrationsContainer,
  StyledIntegrationsList,
} from "@/styles/projects/integrations.styles";
import { trpc } from "@/utils/trpc";
import { IntegrationCard } from "./integration-card";
import { SyncHistory } from "./sync-history";

interface IntegrationsListProps {
  projectId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface IntegrationConfig {
  repository: string;
  branch: string;
  translationPath?: string;
  filePattern?: string;
}

export function IntegrationsList({
  projectId,
  onSuccess,
  onError,
}: IntegrationsListProps) {
  const { data: integration, isLoading } =
    trpc.integrations.getProjectIntegration.useQuery({
      projectId,
    });

  if (isLoading) {
    return (
      <IntegrationsContainer>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Integrations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Loading integrations...
        </Typography>
      </IntegrationsContainer>
    );
  }

  return (
    <IntegrationsContainer>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Integrations
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Connect and manage your repository integrations. Sync your translations
        automatically with your codebase.
      </Typography>

      <StyledIntegrationsList>
        {integration ? (
          <IntegrationCard
            projectId={projectId}
            integration={{
              ...integration,
              config: integration.config as unknown as IntegrationConfig,
            }}
            onSuccess={onSuccess}
            onError={onError}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No integrations configured. Connect a repository to get started.
          </Typography>
        )}
      </StyledIntegrationsList>

      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
        Sync History
      </Typography>

      <SyncHistory projectId={projectId} />
    </IntegrationsContainer>
  );
}
