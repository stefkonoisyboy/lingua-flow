import { Alert, Box, Container, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  padding: theme.spacing(3),
}));

export const LogoWrapper = styled(Box)(() => ({
  marginBottom: 24,
  textAlign: "center",
}));

export const StyledTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const StyledAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  width: "100%",
  maxWidth: 400,
}));

export const ButtonWrapper = styled(Box)(() => ({
  textAlign: "center",
  marginTop: 16,
}));
