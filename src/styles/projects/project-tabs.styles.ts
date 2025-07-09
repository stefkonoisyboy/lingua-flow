import { Box, styled } from "@mui/material";

export const TabsContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(3),
  "& .MuiTab-root": {
    minHeight: 48,
  },
}));
