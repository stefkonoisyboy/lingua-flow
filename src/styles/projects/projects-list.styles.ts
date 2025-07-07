import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const ProjectsListContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  width: "100%",
}));

export const ProjectsListTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1),
}));

export const ProjectsListDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));
