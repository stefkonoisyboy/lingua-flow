import { FC } from "react";
import {
  DialogTitle,
  DialogContent,
  Typography,
  Tooltip,
  Chip,
  CircularProgress,
  Box,
} from "@mui/material";
import {
  Close as CloseIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
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
} from "@/styles/projects/version-history.styles";

interface VersionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  translationId: string;
  keyName: string;
}

export const VersionHistoryDialog: FC<VersionHistoryDialogProps> = ({
  open,
  onClose,
  translationId,
  keyName,
}) => {
  const { data: versions, isLoading } =
    trpc.versionHistory.getVersionHistory.useQuery(
      { translationId },
      { enabled: open }
    );

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <HistoryHeader>
        <Box>
          <StyledDialogTitle>
            <DialogTitle>Version History</DialogTitle>
          </StyledDialogTitle>
          <Typography variant="subtitle1" color="textSecondary">
            {keyName}
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
                </VersionMeta>
                <VersionContent>{version.content}</VersionContent>
              </VersionEntry>
            ))
          )}
        </HistoryContent>
      </DialogContent>
    </StyledDialog>
  );
};
