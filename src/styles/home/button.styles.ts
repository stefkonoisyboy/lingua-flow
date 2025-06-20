import { styled } from "@mui/material/styles";
import { Button } from "@mui/material";

export const SignInButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 4),
  fontSize: "1.1rem",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

export const CreateAccountButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 4),
  fontSize: "1.1rem",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));
