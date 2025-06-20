import { styled } from "@mui/material/styles";
import { Container, Box, Typography, IconButton } from "@mui/material";

export const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "center",
  background: theme.palette.customBackground.gradient,
  padding: theme.spacing(2),
  transition: "background 0.3s ease",
  position: "relative",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1),
  },
}));

export const ThemeToggle = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(2),
  right: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

export const MainContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: theme.spacing(4),
  flex: 1,
  width: "100%",
  maxWidth: 800,
  margin: "0 auto",
  padding: theme.spacing(8, 4),
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(3),
    padding: theme.spacing(4, 2),
  },
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.h1.fontSize,
  fontWeight: 600,
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    fontSize: "2.5rem",
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: "2rem",
  },
}));

export const Subtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.body1.fontSize,
  color: theme.palette.text.secondary,
  maxWidth: 600,
  lineHeight: 1.6,
  padding: theme.spacing(0, 2),
  [theme.breakpoints.down("sm")]: {
    fontSize: "1rem",
    padding: theme.spacing(0, 4),
  },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    width: "100%",
    marginTop: theme.spacing(3),
  },
}));

export const Footer = styled(Box)(({ theme }) => ({
  width: "100%",
  textAlign: "center",
  color: theme.palette.text.secondary,
  padding: theme.spacing(2, 0),
}));

export const FooterText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));
