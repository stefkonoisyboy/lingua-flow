"use client";

import {
  LogoContainer,
  LogoTitle,
  StyledPublicIcon,
} from "../styles/components/logo.styles";

const Logo = () => {
  return (
    <LogoContainer>
      <StyledPublicIcon />
      <LogoTitle variant="h5">LinguaFlow</LogoTitle>
    </LogoContainer>
  );
};

export default Logo;
