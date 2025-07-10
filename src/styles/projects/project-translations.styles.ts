import {
  Box,
  Paper,
  TextareaAutosize,
  styled,
  Select,
  Alert,
  Typography,
} from "@mui/material";

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

export const StyledAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const ErrorText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
}));

interface StyledTextareaProps {
  error?: boolean;
}

export const StyledTextarea = styled(TextareaAutosize)<StyledTextareaProps>(
  ({ theme, error }) => ({
    width: "100%",
    minHeight: "80px",
    padding: theme.spacing(1),
    border: `1px solid ${
      error ? theme.palette.error.main : theme.palette.divider
    }`,
    borderRadius: theme.shape.borderRadius,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.body2.fontSize,
    resize: "vertical",
    "&:focus": {
      outline: "none",
      borderColor: error
        ? theme.palette.error.main
        : theme.palette.primary.main,
    },
    "&:disabled": {
      background: theme.palette.action.disabledBackground,
      cursor: "not-allowed",
    },
  })
);
