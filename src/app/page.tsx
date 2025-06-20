"use client";

import Link from "next/link";
import {
  StyledContainer,
  MainContent,
  ButtonContainer,
  Footer,
  Title,
  Subtitle,
  ThemeToggle,
  FooterText,
} from "./styles/home/container.styles";
import { SignInButton, CreateAccountButton } from "./styles/home/button.styles";
import { useTheme } from "./providers/theme-provider";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Logo from "./components/logo";

export default function Home() {
  const { mode, toggleTheme } = useTheme();

  return (
    <StyledContainer maxWidth={false} disableGutters>
      <ThemeToggle onClick={toggleTheme}>
        {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
      </ThemeToggle>
      <MainContent>
        <Logo />
        <Title variant="h1">Welcome to LinguaFlow</Title>
        <Subtitle variant="body1">
          Streamline your web application localization. Manage translations,
          collaborate seamlessly, and integrate with your workflow.
        </Subtitle>
        <ButtonContainer>
          <Link href="/sign-in" style={{ textDecoration: "none" }}>
            <SignInButton variant="contained">Sign In</SignInButton>
          </Link>
          <Link href="/sign-up" style={{ textDecoration: "none" }}>
            <CreateAccountButton variant="outlined">
              Create Account
            </CreateAccountButton>
          </Link>
        </ButtonContainer>
      </MainContent>
      <Footer>
        <FooterText variant="body2">
          © 2025 LinguaFlow. All rights reserved.
        </FooterText>
      </Footer>
    </StyledContainer>
  );
}
