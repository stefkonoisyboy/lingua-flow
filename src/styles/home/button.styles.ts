import { styled } from "@mui/material/styles";
import { Button } from "@mui/material";
import Link from "next/link";

export const SignInButton = styled(Button)(() => ({
  minWidth: 120,
}));

export const CreateAccountButton = styled(Button)(() => ({
  minWidth: 120,
}));

export const StyledLink = styled(Link)(() => ({
  textDecoration: "none",
}));
