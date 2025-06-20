import {
  LogoContainer,
  LogoTitle,
  StyledPublicIcon,
} from "@/styles/components/logo.styles";

export default function Logo() {
  return (
    <LogoContainer>
      <StyledPublicIcon />
      <LogoTitle variant="h6">LinguaFlow</LogoTitle>
    </LogoContainer>
  );
}
