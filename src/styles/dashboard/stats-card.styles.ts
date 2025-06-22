import { styled } from '@mui/material/styles';
import { Card, Typography } from '@mui/material';

export const StatsCardContainer = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'mode',
})<{ mode?: "default" | "warning" }>(({ theme, mode }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  backgroundColor: theme.palette.background.paper,
  transition: 'transform 0.2s ease-in-out',
  border: mode === "warning" ? `1px solid ${theme.palette.error.main}` : 'none',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

export const StatsCardContent = styled('div')(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
}));

export const StatsValue = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'mode',
})<{ mode?: "default" | "warning" }>(({ theme, mode }) => ({
  fontWeight: 600,
  color: mode === "warning" ? theme.palette.error.main : theme.palette.text.primary,
  marginBottom: theme.spacing(0.5),
}));

export const StatsLabel = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1),
}));

export const StatsSubtext = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  opacity: 0.8,
}));

export const StatsIcon = styled('div', {
  shouldForwardProp: (prop) => prop !== 'mode',
})<{ mode?: "default" | "warning" }>(({ theme, mode }) => ({
  color: mode === "warning" ? theme.palette.error.main : theme.palette.primary.main,
  '& > svg': {
    fontSize: '2.5rem',
  },
})); 