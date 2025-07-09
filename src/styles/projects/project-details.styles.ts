import { Box, styled } from "@mui/material";

export const PageHeader = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 24,
}));

export const HeaderContent = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: 8,
}));

export const TabsWrapper = styled(Box)(() => ({
  marginTop: 32,
  marginBottom: 16,
}));
