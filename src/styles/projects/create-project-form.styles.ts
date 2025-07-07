import { Box, Typography, styled } from "@mui/material";

export const GitHubConfigContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const WaitingText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

export const ErrorText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  color: theme.palette.error.main,
}));

export const GitHubSwitchContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));
