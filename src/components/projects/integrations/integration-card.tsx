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
import { useRouter } from "next/navigation";
import { setConflicts } from "@/store/slices/conflict-resolution.slice";
import { useAppDispatch } from "@/store/hooks";

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
  const router = useRouter();
  const dispatch = useAppDispatch();

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

  const exportTranslations = trpc.integrations.exportTranslations.useMutation({
    onSuccess: (data) => {
      onSuccess("Translations exported successfully!");
      utils.syncHistory.getByProjectId.invalidate({ projectId });

      if (data.pullRequestUrl) {
        const newWindow = window.open(data.pullRequestUrl, "_blank");

        if (newWindow) {
          newWindow.focus();
        }
      }
    },
    onError: (error) => {
      onError(`Error exporting translations: ${error.message}`);
      utils.syncHistory.getByProjectId.invalidate({ projectId });
    },
  });

  const pullAndDetectConflicts =
    trpc.integrations.pullAndDetectConflicts.useMutation({
      onSuccess: (data) => {
        onSuccess("Conflicts detected successfully!");
        dispatch(setConflicts(data));
        router.push(`/projects/${projectId}/conflict-resolution`);
      },
      onError: (error) => {
        onError(`Error pulling and detecting conflicts: ${error.message}`);
        console.log(error);
      },
    });

  const handleExport = async () => {
    // await exportTranslations.mutateAsync({
    //   projectId,
    //   repository: integration.config.repository,
    //   baseBranch: integration.config.branch,
    // });

    await pullAndDetectConflicts.mutateAsync({
      projectId,
      integrationId: integration.id,
      repository: integration.config.repository,
      branch: integration.config.branch,
    });
  };

  const handleToggleConnection = async () => {
    if (integration.is_connected) {
      setIsDisconnectDialogOpen(true);
    } else {
      await updateIntegrationStatus.mutateAsync({
        integrationId: integration.id,
        isConnected: true,
      });
    }
  };

  const handleDisconnect = async () => {
    await updateIntegrationStatus.mutateAsync({
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
              <IconButton
                color="primary"
                disabled={
                  !integration.is_connected ||
                  exportTranslations.isPending ||
                  pullAndDetectConflicts.isPending
                }
                onClick={handleExport}
              >
                {exportTranslations.isPending ||
                pullAndDetectConflicts.isPending ? (
                  <CircularProgress size={20} />
                ) : (
                  <SyncIcon />
                )}
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
