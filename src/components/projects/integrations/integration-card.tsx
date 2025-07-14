"use client";

import { useState } from "react";
import {
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
} from "@mui/icons-material";
import {
  IntegrationCard as StyledIntegrationCard,
  IntegrationHeader,
  IntegrationInfo,
  IntegrationActions,
} from "@/styles/projects/integrations.styles";
import { trpc } from "@/utils/trpc";

interface IntegrationCardProps {
  projectId: string;
  integration: {
    id: string;
    type: string;
    is_connected: boolean;
    last_synced_at: string | null;
    config: {
      repository: string;
      branch: string;
      translationPath?: string;
      filePattern?: string;
    };
  };
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function IntegrationCard({
  projectId,
  integration,
  onSuccess,
  onError,
}: IntegrationCardProps) {
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const utils = trpc.useUtils();

  const updateIntegrationStatus =
    trpc.integrations.updateIntegrationStatus.useMutation({
      onSuccess: () => {
        onSuccess(
          integration.is_connected
            ? "Integration disconnected"
            : "Integration connected"
        );
        utils.integrations.getProjectIntegration.invalidate({ projectId });
      },
      onError: (error) => {
        onError(`Error updating integration status: ${error.message}`);
      },
    });

  const handleToggleConnection = () => {
    if (integration.is_connected) {
      setIsDisconnectDialogOpen(true);
    } else {
      updateIntegrationStatus.mutate({
        integrationId: integration.id,
        isConnected: true,
      });
    }
  };

  const handleDisconnect = () => {
    updateIntegrationStatus.mutate({
      integrationId: integration.id,
      isConnected: false,
    });
    setIsDisconnectDialogOpen(false);
  };

  return (
    <>
      <StyledIntegrationCard>
        <IntegrationHeader>
          <Typography variant="h6">
            {integration.type === "github" ? "GitHub" : "Unknown"} Repository
          </Typography>
          <IntegrationActions>
            <Tooltip title="Sync now">
              <IconButton color="primary" disabled={!integration.is_connected}>
                <SyncIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton color="primary">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              color={integration.is_connected ? "error" : "primary"}
              startIcon={
                integration.is_connected ? <LinkOffIcon /> : <LinkIcon />
              }
              onClick={handleToggleConnection}
              disabled={updateIntegrationStatus.isPending}
            >
              {updateIntegrationStatus.isPending ? (
                <CircularProgress size={24} />
              ) : integration.is_connected ? (
                "Disconnect"
              ) : (
                "Connect"
              )}
            </Button>
          </IntegrationActions>
        </IntegrationHeader>

        <IntegrationInfo>
          <Typography variant="body1">
            Repository: {integration.config.repository}
          </Typography>
          <Typography variant="body2">
            Branch: {integration.config.branch}
          </Typography>
          {integration.config.translationPath && (
            <Typography variant="body2">
              Path: {integration.config.translationPath}
            </Typography>
          )}
          {integration.config.filePattern && (
            <Typography variant="body2">
              Pattern: {integration.config.filePattern}
            </Typography>
          )}
          {integration.last_synced_at && (
            <Typography variant="body2" color="text.secondary">
              Last synced:{" "}
              {new Date(integration.last_synced_at).toLocaleString()}
            </Typography>
          )}
        </IntegrationInfo>
      </StyledIntegrationCard>

      <Dialog
        open={isDisconnectDialogOpen}
        onClose={() => setIsDisconnectDialogOpen(false)}
      >
        <DialogTitle>Disconnect Integration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to disconnect this integration? This will stop
            automatic synchronization with the repository.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDisconnectDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDisconnect}
            color="error"
            variant="contained"
            disabled={updateIntegrationStatus.isPending}
          >
            {updateIntegrationStatus.isPending ? (
              <CircularProgress size={24} />
            ) : (
              "Disconnect"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
