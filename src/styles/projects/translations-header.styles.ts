import { styled } from "@mui/material/styles";
import { Box, Typography, FormControl } from "@mui/material";

export const HeaderContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

export const HeaderTitle = styled(Typography)({
  fontWeight: 600,
});

export const HeaderDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(3),
}));

export const HeaderActions = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "center",
}));

export const LanguageSelectControl = styled(FormControl)({
  minWidth: 200,
});
