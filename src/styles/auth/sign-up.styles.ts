import { styled } from "@mui/material/styles";
import { Box, Container, TextField, Button, Typography } from "@mui/material";

export const SignUpContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  padding: theme.spacing(3),
}));

export const SignUpBox = styled(Box)(({ theme }) => ({
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

export const LogoBox = styled(Box)({
  marginBottom: "24px",
});

export const StyledTextField = styled(TextField)(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(2),
}));

export const SignUpButton = styled(Button)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1.5),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const Subtitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const SignInText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  textAlign: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(0.5),
}));

export const SignInLink = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  cursor: "pointer",
  "&:hover": {
    textDecoration: "underline",
  },
}));

export const AlertWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  width: "100%",
}));
