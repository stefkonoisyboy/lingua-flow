import { styled, Box } from "@mui/material";

export const StyledTabsContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.neutral.main,
  borderRadius: theme.shape.borderRadius,
  width: "fit-content",
  padding: theme.spacing(0.5),
  "& .MuiTabs-root": {
    minHeight: 32,
  },
  "& .MuiTab-root": {
    textTransform: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
    minHeight: 32,
    padding: "6px 16px",
    color: theme.palette.text.secondary,
    "&.Mui-selected": {
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.primary.main,
    },
  },
}));
