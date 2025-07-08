import { styled, Button, Box } from "@mui/material";

export const StyledHeader = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
});

export const StyledSaveButton = styled(Button)(({ theme }) => ({
  minWidth: 150,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.neutral.main,
  color: theme.palette.text.primary,
  "&:hover": {
    backgroundColor: theme.palette.neutral.hover,
  },
}));
