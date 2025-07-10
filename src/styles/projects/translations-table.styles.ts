import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const ActionButtons = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  justifyContent: "center",
}));
