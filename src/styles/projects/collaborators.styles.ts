import { styled } from "@mui/material/styles";

export const CollaboratorsListTableContainer = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  boxShadow: theme.shadows[1],
}));
