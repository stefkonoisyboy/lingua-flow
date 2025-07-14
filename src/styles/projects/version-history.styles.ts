import { styled } from "@mui/material/styles";
import { Dialog, Box, IconButton, Chip } from "@mui/material";

export const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    width: 100%;
    max-width: 800px;
    max-height: 80vh;
  }
`;

export const HistoryHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing(3)};
  padding-bottom: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.paper};
`;

export const HistoryContent = styled(Box)`
  padding: ${({ theme }) => theme.spacing(3)};
  height: 100%;
  overflow-y: auto;
`;

export const VersionEntry = styled(Box)`
  padding: ${({ theme }) => theme.spacing(3)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.palette.background.paper};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  box-shadow: ${({ theme }) => theme.shadows[1]};
  transition: box-shadow 0.2s ease-in-out;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows[3]};
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

export const VersionMeta = styled(Box)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  flex-wrap: wrap;
`;

export const VersionContent = styled(Box)`
  background-color: ${({ theme }) =>
    theme.palette.customBackground.versionContent};
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.9rem;
  line-height: 1.5;
  border: 1px solid ${({ theme }) => theme.palette.divider};
`;

export const StyledDialogTitle = styled(Box)`
  .MuiDialogTitle-root {
    padding: 0;
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: ${({ theme }) => theme.spacing(0.5)};
  }
`;

export const StyledCloseButton = styled(IconButton)`
  margin-top: ${({ theme }) => theme.spacing(-1)};
`;

export const StyledVersionChip = styled(Chip)`
  font-weight: 500;
`;

export const KeyName = styled("span")`
  color: ${({ theme }) => theme.palette.primary.main};
`;
