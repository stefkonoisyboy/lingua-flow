import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const ProjectSettingsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

export const SettingsSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.customBackground.settingsSection,
  borderRadius: theme.shape.borderRadius,
}));

export const LanguagesList = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const LanguageItem = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));

export const ActionButtons = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
}));

export const LanguageInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export const FlagImage = styled("img")({
  width: "24px",
  height: "16px",
  objectFit: "cover",
  borderRadius: "2px",
});

export const AlertContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const FormContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const FormActions = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
});

export const LanguageSelectionContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const LanguageMenuItem = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});
