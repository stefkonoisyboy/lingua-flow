"use client";

import Logo from "@/components/logo";
import { Button } from "@mui/material";
import Link from "next/link";
import {
  StyledContainer,
  LogoWrapper,
  StyledTitle,
  StyledAlert,
  ButtonWrapper,
} from "@/styles/auth/auth-error.styles";

const AuthError = () => {
  return (
    <StyledContainer>
      <LogoWrapper>
        <Logo />
      </LogoWrapper>

      <StyledTitle variant="h5">Authentication Error</StyledTitle>

      <StyledAlert severity="error">
        There was a problem with the authentication process. This could be due
        to:
        <ul>
          <li>An expired or invalid link</li>
          <li>A previously used link</li>
          <li>A network or server error</li>
        </ul>
      </StyledAlert>

      <ButtonWrapper>
        <Button component={Link} href="/sign-in" variant="contained">
          Return to Sign In
        </Button>
      </ButtonWrapper>
    </StyledContainer>
  );
};

export default AuthError;
