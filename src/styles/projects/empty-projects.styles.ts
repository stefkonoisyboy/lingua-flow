import { Box, styled } from "@mui/material";
import { FolderOpen as FolderOpenIcon } from "@mui/icons-material";

export const EmptyProjectsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: `${theme.spacing(8)} ${theme.spacing(2)}`,
  textAlign: "center",
}));

export const EmptyProjectsIcon = styled(FolderOpenIcon)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

export const EmptyProjectsDescription = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(3),
  maxWidth: 400,
}));
