import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export const HeaderContent = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const TabsWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const ComingSoonText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(4),
  textAlign: "center",
}));
