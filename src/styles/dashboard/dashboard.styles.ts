import { Container, Typography, Button } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

export const HeaderContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(4),
}));

export const StyledTitle = styled(Typography)(() => ({
  margin: 0,
}));

export const LogoutButton = styled(Button)(() => ({
  marginLeft: "16px",
}));
