import { Box, Paper, TextareaAutosize, styled, Select } from "@mui/material";

export const TranslationsContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const HeaderContainer = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 24,
}));

export const ControlsContainer = styled(Box)(() => ({
  display: "flex",
  gap: 16,
  marginBottom: 24,
}));

export const PaginationContainer = styled(Box)(() => ({
  marginTop: 16,
  display: "flex",
  justifyContent: "center",
}));

export const PlaceholderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: `${theme.spacing(8)} ${theme.spacing(2)}`,
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
}));

export const PlaceholderIcon = styled(Box)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

export const PlaceholderText = styled(Box)(() => ({
  maxWidth: 400,
  textAlign: "center",
}));

export const LoadingContainer = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  padding: 32,
}));

export const StyledSelect = styled(Select)(() => ({
  minWidth: 200,
}));

export const StyledTextarea = styled(TextareaAutosize)(({ theme }) => ({
  width: "100%",
  minHeight: "80px",
  padding: "8px 12px",
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.body1.fontSize,
  resize: "vertical",
  backgroundColor: "transparent",
  color: theme.palette.text.primary,
  "&:disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.text.disabled,
  },
  "&:focus": {
    outline: "none",
    borderColor: theme.palette.primary.main,
    borderWidth: "2px",
  },
  "&::placeholder": {
    color: theme.palette.text.secondary,
  },
}));
