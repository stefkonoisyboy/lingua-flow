import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const ProjectsTableContainer = styled(Box)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  boxShadow: theme.shadows[1],

  "& .MuiTableCell-root": {
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2),
  },

  "& .MuiTableHead-root .MuiTableCell-root": {
    fontWeight: 600,
    backgroundColor: theme.palette.background.default,
  },
}));
