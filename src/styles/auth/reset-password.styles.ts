import { styled } from "@mui/material/styles";
import { Box, Container, Typography, Button } from "@mui/material";

export const StyledContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  padding: theme.spacing(3),
}));

export const ResetPasswordBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  width: "100%",
  maxWidth: 400,
}));

export const LogoWrapper = styled(Box)(() => ({
  marginBottom: "24px",
}));

export const StyledTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const StyledSubtitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

export const AlertWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  width: "100%",
}));

export const SubmitButton = styled(Button)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1.5),
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
}));

export const FooterWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  textAlign: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(0.5),
}));

export const StyledLink = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  cursor: "pointer",
  "&:hover": {
    textDecoration: "underline",
  },
}));
