import { styled } from "@mui/material/styles";
import { Box, Button, Typography } from "@mui/material";

export const IntegrationsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  backgroundColor: theme.palette.customBackground.settingsSection,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

export const StyledIntegrationsList = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const StyledConnectButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const StyledSyncHistoryTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));

export const IntegrationCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));

export const IntegrationHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "16px",
});

export const IntegrationInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const IntegrationActions = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
}));

export const SyncHistoryList = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const SyncHistoryItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.customBackground.settingsSection,
  borderRadius: theme.shape.borderRadius,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

export const SyncDetails = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

export const RepositorySelectorContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));
