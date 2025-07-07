import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const ProjectsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  width: "100%",
  maxWidth: "100%",
  overflow: "hidden",
}));
