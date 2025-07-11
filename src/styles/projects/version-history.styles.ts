import { styled } from "@mui/material/styles";
import { Dialog, Box, IconButton, Chip } from "@mui/material";

export const StyledDialog = styled(Dialog)``;

export const HistoryHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing(3)};
  padding-bottom: 0;
`;

export const HistoryContent = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const VersionEntry = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const VersionMeta = styled(Box)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  flex-wrap: wrap;
`;

export const VersionContent = styled(Box)`
  background-color: ${({ theme }) => theme.palette.action.hover};
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  white-space: pre-wrap;
`;

export const StyledDialogTitle = styled(Box)`
  padding: 0;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

export const StyledCloseButton = styled(IconButton)`
  margin-top: ${({ theme }) => theme.spacing(-1)};
`;

export const StyledVersionChip = styled(Chip)`
  font-weight: 500;
`;
