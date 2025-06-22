import { styled } from '@mui/material/styles';
import { Paper, Typography } from '@mui/material';

export const ActivityContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  marginTop: theme.spacing(3),
}));

export const ActivityTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 500,
  marginBottom: theme.spacing(1),
}));

export const ActivityDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  marginBottom: theme.spacing(3),
}));

export const ActivityList = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

export const ActivityItem = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
}));

export const ActivityIcon = styled('div')(() => ({
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& > svg': {
    fontSize: '1.5rem',
  },
}));

export const ActivityContent = styled('div')(() => ({
  flex: 1,
}));

export const ActivityText = styled(Typography)(() => ({
  fontSize: '0.875rem',
  lineHeight: 1.5,
  '& strong': {
    fontWeight: 500,
  },
}));

export const ActivityTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
})); 