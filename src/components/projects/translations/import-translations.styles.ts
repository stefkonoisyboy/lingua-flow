import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  IconButton,
  RadioGroup,
  Select,
  CircularProgress,
} from "@mui/material";

export const ImportDialogContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[8],
  padding: theme.spacing(3, 3, 2, 3),
  width: "100%",
}));

export const ImportDialogTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: 24,
  marginBottom: theme.spacing(1),
}));

export const ImportDialogSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

export const DropzoneArea = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.spacing(1.5),
  background: theme.palette.action.hover,
  padding: theme.spacing(4, 2),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  marginBottom: theme.spacing(3),
  transition: "border-color 0.2s",
}));

export const DropzoneIcon = styled(Box)(({ theme }) => ({
  color: theme.palette.primary.light,
  fontSize: 48,
  marginBottom: theme.spacing(1),
}));

export const DropzoneText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: 16,
  textAlign: "center",
}));

export const UploadedFileBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  background: theme.palette.action.selected,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  marginBottom: theme.spacing(2),
  gap: theme.spacing(2),
}));

export const ImportDialogFileName = styled(Typography)(() => ({
  fontWeight: 500,
  fontSize: 16,
}));

export const ImportDialogFileRemoveButton = styled(IconButton)(({ theme }) => ({
  marginLeft: "auto",
  color: theme.palette.error.main,
}));

export const ImportDialogRadioGroup = styled(RadioGroup)(({ theme }) => ({
  flexDirection: "row",
  gap: theme.spacing(2),
  marginLeft: theme.spacing(2),
}));

export const ImportDialogSelect = styled(Select)(() => ({
  minWidth: 180,
}));

export const PreviewBox = styled(Box)(({ theme }) => ({
  background: theme.palette.background.default,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  maxHeight: 180,
  overflowY: "auto",
  fontFamily: "monospace",
  fontSize: 14,
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
}));

export const ImportDialogActions = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

export const ImportDialogProgress = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 180,
  gap: theme.spacing(2),
}));

export const ImportDialogSpinner = styled(CircularProgress)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

export const ImportDialogProgressBar = styled(Box)(({ theme }) => ({
  width: "100%",
  height: 8,
  borderRadius: 4,
  background: theme.palette.action.disabledBackground,
  overflow: "hidden",
  marginTop: theme.spacing(2),
}));

export const ImportDialogResult = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 180,
  gap: theme.spacing(2),
}));

export const ImportDialogResultStat = styled(Box)({
  display: "inline-block",
  fontWeight: 600,
  fontSize: 16,
});

export const ImportDialogCloseIcon = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(2),
  right: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

export const ImportDialogError = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  marginTop: theme.spacing(2),
  textAlign: "center",
}));

export const ImportDialogSuccessIcon = styled(Box)({
  fontSize: 56,
});
