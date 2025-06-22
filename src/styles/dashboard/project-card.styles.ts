import { styled } from '@mui/material/styles';
import { Card, Typography, LinearProgress, Button } from '@mui/material';

export const ProjectCardContainer = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: theme.spacing(1.5),
  },
}));

export const ProjectCardContent = styled('div')(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    gap: theme.spacing(1.5),
  },
}));

export const ProjectTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  fontSize: '1rem',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.9375rem',
  },
}));

export const ProjectStats = styled('div')(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.8125rem',
  },
}));

export const ProjectProgress = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(0.75),
  },
}));

export const ProjectProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
  },
  [theme.breakpoints.down('sm')]: {
    height: 6,
    borderRadius: 3,
    '& .MuiLinearProgress-bar': {
      borderRadius: 3,
    },
  },
}));

export const LastUpdate = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  opacity: 0.8,
  fontSize: '0.75rem',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.6875rem',
  },
}));

export const ViewButton = styled(Button)(({ theme }) => ({
  alignSelf: 'flex-end',
  marginTop: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5, 1.5),
    fontSize: '0.8125rem',
  },
})); 