import { styled } from "@mui/material/styles";
import { Container, Typography, Button } from "@mui/material";
import { Form as FormikForm } from "formik";

export const StyledContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  padding: theme.spacing(3),
}));

export const ResetPasswordBox = styled("div")(({ theme }) => ({
  width: "100%",
  maxWidth: 400,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

export const LogoWrapper = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export const StyledTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

export const StyledSubtitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

export const AlertWrapper = styled("div")(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(2),
}));

export const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(2, 0),
}));

export const FooterWrapper = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(2),
  textAlign: "center",
}));

export const StyledLink = styled("span")(({ theme }) => ({
  marginLeft: theme.spacing(0.5),
  color: theme.palette.primary.main,
  cursor: "pointer",
  "&:hover": {
    textDecoration: "underline",
  },
}));

export const StyledForm = styled(FormikForm)(() => ({
  width: "100%",
}));
