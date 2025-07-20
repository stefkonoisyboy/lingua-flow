import { styled } from "@mui/material/styles";
import { Chip, TextField } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Conflict Resolution List Styles
export const StyledConflictChip = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

// Conflict Resolution Success Styles
export const StyledCheckCircleIcon = styled(CheckCircleIcon)(() => ({
  fontSize: 48,
}));

// Main Page Styles
export const StyledMainCheckCircleIcon = styled(CheckCircleIcon)(() => ({
  fontSize: 64,
}));
