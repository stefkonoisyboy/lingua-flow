"use client";

import {
  StyledContainer,
  ThemeToggle,
  MainContent,
  Title,
  Subtitle,
  ButtonContainer,
  Footer,
} from "@/styles/home/container.styles";
import {
  SignInButton,
  CreateAccountButton,
  StyledLink,
} from "@/styles/home/button.styles";
import { useTheme } from "@/providers/theme-provider";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Logo from "@/components/logo";

export default function Home() {
  const { theme, toggleColorMode } = useTheme();

  return (
    <StyledContainer maxWidth={false}>
      <ThemeToggle onClick={toggleColorMode}>
        {theme === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
      </ThemeToggle>

      <MainContent>
        <Logo />
        <Title variant="h1">Welcome to LinguaFlow</Title>
        <Subtitle variant="body1">
          Your AI-powered language learning companion. Start your journey to
          fluency today with personalized lessons, real-time feedback, and
          interactive exercises.
        </Subtitle>
        <ButtonContainer>
          <StyledLink href="/sign-in">
            <SignInButton variant="contained" color="primary">
              Sign In
            </SignInButton>
          </StyledLink>
          <StyledLink href="/sign-up">
            <CreateAccountButton variant="outlined" color="primary">
              Create Account
            </CreateAccountButton>
          </StyledLink>
        </ButtonContainer>
      </MainContent>

      <Footer>
        © {new Date().getFullYear()} LinguaFlow. All rights reserved.
      </Footer>
    </StyledContainer>
  );
}
