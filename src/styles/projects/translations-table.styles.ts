import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const ActionButtons = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  justifyContent: "center",
}));

export const ErrorMessage = styled(Box)(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: "0.75rem",
  marginTop: theme.spacing(0.5),
}));
