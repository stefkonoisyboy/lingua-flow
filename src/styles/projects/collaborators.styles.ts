import { styled } from "@mui/material/styles";
import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Alert,
  Typography,
} from "@mui/material";

export const CollaboratorsListTableContainer = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  boxShadow: theme.shadows[1],
}));

// Accept Invitation Page Styles
export const CenteredContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
}));

export const Card = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  boxShadow: theme.shadows[3],
  maxWidth: 500,
  width: "100%",
  textAlign: "center",
}));

export const LogoRow = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export const Footer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

// Dialog Styles
export const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: theme.shape.borderRadius,
  },
}));

export const DialogContentStyled = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
}));

export const DialogActionsStyled = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  gap: theme.spacing(1),
}));

// Button Styles
export const PrimaryButton = styled(Button)(() => ({
  minWidth: 120,
}));

export const DangerButton = styled(Button)(() => ({
  minWidth: 120,
}));

// Member Info Styles
export const MemberInfoContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(3),
}));

export const MemberAvatar = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

export const MemberDetails = styled(Box)(() => ({
  flex: 1,
}));

// Form Styles
export const FormContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const FormActions = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

// Alert Styles
export const AlertContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

// Loading States
export const LoadingContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
}));

export const IconContainer = styled(Box)(() => ({
  fontSize: 56,
}));

// Invite Dialog Styles
export const InviteDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
}));

export const InviteFormContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const InviteDescription = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const StyledAvatar = styled(Avatar)(({ theme }) => ({
  marginRight: theme.spacing(1),
}));

export const InviteCollaboratorButton = styled(Button)({
  minWidth: 180,
});

export const EditMemberRoleAvatar = styled(Avatar)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

export const OwnershipTransferWarning = styled(Alert)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const ConfirmOwnershipWarning = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const ConfirmOwnershipWarningContent = styled(Typography)(
  ({ theme }) => ({
    paddingLeft: theme.spacing(2),
  })
);

export const ActionCannotBeUndone = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const InviteEmailContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));
