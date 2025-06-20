import { Box, Typography, styled } from "@mui/material";
import { Public as PublicIcon } from "@mui/icons-material";

export const LogoContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export const LogoTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const StyledPublicIcon = styled(PublicIcon)(({ theme }) => ({
  fontSize: 32,
  color: theme.palette.primary.main,
}));
