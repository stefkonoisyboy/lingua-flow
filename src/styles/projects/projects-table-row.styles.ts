import { TableRow, MenuItem, styled } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

export const StyledTableRow = styled(TableRow)(() => ({
  cursor: "pointer",
}));

export const LanguageChipsContainer = styled("div")(() => ({
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
}));

export const DeleteMenuIcon = styled(DeleteIcon)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export const DeleteMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.palette.error.main,
}));
