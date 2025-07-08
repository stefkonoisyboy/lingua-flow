import {
  styled,
  Box,
  TableCell,
  IconButton,
  TextField,
  Paper,
} from "@mui/material";

export const StyledContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
}));

export const StyledHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
}));

export const StyledTitleContainer = styled(Box)(({ theme }) => ({
  "& h1": {
    marginBottom: theme.spacing(1),
  },
}));

export const StyledActionsContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
});

export const StyledTableHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.background.default,
}));

export const StyledTranslationCell = styled(TableCell)({
  minWidth: 200,
  maxWidth: 400,
});

export const StyledCommentButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  "&:hover": {
    color: theme.palette.primary.main,
  },
}));

export const StyledKeyTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: theme.palette.background.default,
  },
}));

export const StyledTranslationTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: theme.palette.background.paper,
  },
}));
