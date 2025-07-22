import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const ImportExportCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.customBackground.settingsSection,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

export const ActionsRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
}));
