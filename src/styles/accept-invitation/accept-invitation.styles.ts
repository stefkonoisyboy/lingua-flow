import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

export const CenteredContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: theme.palette.background.default,
}));

export const Card = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5, 6),
  borderRadius: 16,
  minWidth: 400,
  maxWidth: "90vw",
  textAlign: "center",
  boxShadow: theme.shadows[3],
}));

export const LogoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  position: "absolute",
  top: theme.spacing(4),
  left: theme.spacing(6),
}));

export const Footer = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(4),
  left: 0,
  width: "100%",
  textAlign: "center",
  color: theme.palette.text.secondary,
  fontSize: 14,
}));
