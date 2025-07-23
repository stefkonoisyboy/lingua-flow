import { FC, useState } from "react";
import {
  DialogTitle,
  DialogContent,
  Typography,
  Tooltip,
  Chip,
  CircularProgress,
  Box,
  IconButton,
  Snackbar,
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  Button,
} from "@mui/material";
import {
  Close as CloseIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { trpc } from "@/utils/trpc";
import {
  StyledDialog,
  HistoryHeader,
  HistoryContent,
  VersionEntry,
  VersionMeta,
  VersionContent,
  StyledDialogTitle,
  StyledCloseButton,
  StyledVersionChip,
  KeyName,
} from "@/styles/projects/version-history.styles";
import { useParams } from "next/navigation";
import { FullWidthAlert } from "./version-history-dialog.styles";

interface VersionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  translationId: string;
  keyName: string;
  languageName: string;
}

export const VersionHistoryDialog: FC<VersionHistoryDialogProps> = ({
  open,
  onClose,
  translationId,
  keyName,
  languageName,
}) => {
  const utils = trpc.useUtils();
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: versions, isLoading } =
    trpc.versionHistory.getVersionHistory.useQuery(
      { translationId },
      { enabled: open }
    );

  const revertMutation =
    trpc.versionHistory.revertTranslationToVersion.useMutation({
      onSuccess: () => {
        utils.versionHistory.getVersionHistory.invalidate({ translationId });
        utils.translations.getTranslationKeys.invalidate({ projectId });

        setSnackbar({
          open: true,
          message: "Reverted successfully!",
          severity: "success",
        });
      },
      onError: (err) => {
        setSnackbar({
          open: true,
          message: err.message || "Failed to revert",
          severity: "error",
        });
      },
    });
  const [revertTarget, setRevertTarget] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingVersionId, setPendingVersionId] = useState<string | null>(null);

  const handleRevert = (versionId: string) => {
    setPendingVersionId(versionId);
    setConfirmOpen(true);
  };

  const handleConfirmRevert = async () => {
    if (!pendingVersionId) {
      return;
    }

    setRevertTarget(pendingVersionId);

    try {
      await revertMutation.mutateAsync({
        translationId,
        versionId: pendingVersionId,
      });
      setConfirmOpen(false);
    } finally {
      setRevertTarget(null);
      setPendingVersionId(null);
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <HistoryHeader>
        <Box>
          <StyledDialogTitle>
            <DialogTitle>
              Version History: <KeyName>{keyName}</KeyName>
            </DialogTitle>
          </StyledDialogTitle>
          <Typography variant="subtitle1" color="textSecondary">
            Review the change history for this translation in {languageName}.
          </Typography>
        </Box>
        <StyledCloseButton onClick={onClose} size="small">
          <CloseIcon />
        </StyledCloseButton>
      </HistoryHeader>

      <DialogContent>
        <HistoryContent>
          {isLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : versions?.length === 0 ? (
            <Box textAlign="center" p={4}>
              <Typography color="textSecondary">
                No version history available
              </Typography>
            </Box>
          ) : (
            versions?.map((version) => (
              <VersionEntry key={version.id}>
                <VersionMeta>
                  <StyledVersionChip
                    label={`Version ${version.version_number}`}
                    color="primary"
                    size="small"
                  />
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="textSecondary">
                      {format(new Date(version.created_at), "PPpp")}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" color="action" />
                    <Tooltip title="Changed by">
                      <Typography variant="body2" color="textSecondary">
                        {version.user?.email}
                      </Typography>
                    </Tooltip>
                  </Box>
                  {version.version_name && (
                    <Chip
                      label={version.version_name}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {versions.length > 1 && (
                    <Tooltip title="Revert to this version">
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => handleRevert(version.id)}
                          disabled={
                            revertMutation.isPending &&
                            revertTarget === version.id
                          }
                        >
                          {revertMutation.isPending &&
                          revertTarget === version.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <HistoryIcon />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </VersionMeta>
                <VersionContent>{version.content}</VersionContent>
              </VersionEntry>
            ))
          )}
        </HistoryContent>
      </DialogContent>
      <MuiDialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <MuiDialogTitle>Revert to this version?</MuiDialogTitle>
        <MuiDialogContent>
          <Typography>
            Are you sure you want to revert this translation to the selected
            version? This action cannot be undone.
          </Typography>
        </MuiDialogContent>
        <Box display="flex" justifyContent="flex-end" gap={1} p={2}>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={revertMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRevert}
            color="error"
            variant="contained"
            disabled={revertMutation.isPending}
            startIcon={<HistoryIcon />}
          >
            {revertMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              "Revert"
            )}
          </Button>
        </Box>
      </MuiDialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <FullWidthAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </FullWidthAlert>
      </Snackbar>
    </StyledDialog>
  );
};
