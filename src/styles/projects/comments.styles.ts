import { styled } from "@mui/material/styles";
import { Dialog, Box, IconButton } from "@mui/material";

export const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    width: 100%;
    max-width: 800px;
    max-height: 80vh;
  }
`;

export const DialogHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing(3)};
  padding-bottom: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.paper};
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
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

export const DialogContentWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(3)};
  height: 100%;
  overflow-y: auto;
`;

export const CommentEntry = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.default};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

export const CommentMeta = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const CommentContent = styled(Box)`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

export const CommentForm = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.default};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

export const KeyName = styled("span")`
  color: ${({ theme }) => theme.palette.primary.main};
`;
