"use client";

import { useAuth } from "@/hooks/use-auth";
import { LogoutOutlined } from "@mui/icons-material";
import {
  StyledContainer,
  HeaderContainer,
  StyledTitle,
  LogoutButton,
} from "@/styles/dashboard/dashboard.styles";

export default function Dashboard() {
  const { signOut, loading } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <StyledContainer>
      <HeaderContainer>
        <StyledTitle variant="h4">Welcome to LinguaFlow Dashboard</StyledTitle>
        <LogoutButton
          variant="outlined"
          color="primary"
          onClick={handleLogout}
          disabled={loading}
          startIcon={<LogoutOutlined />}
        >
          Sign out
        </LogoutButton>
      </HeaderContainer>
    </StyledContainer>
  );
}
