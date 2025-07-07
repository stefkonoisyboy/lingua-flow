import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const ProjectsHeaderContainer = styled(Box)(({}) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
}));

export const ProjectsHeaderTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

export const CreateProjectButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  borderRadius: theme.shape.borderRadius,
}));
