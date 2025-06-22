import { styled } from '@mui/material/styles';
import { Avatar as MuiAvatar, IconButton as MuiIconButton, Box } from '@mui/material';

const SIDEBAR_WIDTH = 280;
const TOPBAR_HEIGHT = 64;
const MOBILE_TOPBAR_HEIGHT = 56;

export const TopbarContainer = styled('div')(({ theme }) => ({
  height: TOPBAR_HEIGHT,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'end',
  alignItems: 'center',
  padding: theme.spacing(2),
  gap: theme.spacing(2),
  position: 'fixed',
  top: 0,
  right: 0,
  width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
  left: SIDEBAR_WIDTH,
  zIndex: theme.zIndex.appBar,
  transition: theme.transitions.create(['left', 'width', 'height'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down('md')]: {
    left: 0,
    width: '100%',
    height: MOBILE_TOPBAR_HEIGHT,
    padding: theme.spacing(0, 2),
    justifyContent: 'space-between',
  },
}));

export const RightSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

export const UserSection = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  cursor: 'pointer',
}));

export const UserInfo = styled('div')(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.up('sm')]: {
    display: 'block',
  },
}));

export const UserName = styled('span')(() => ({
  fontSize: '0.875rem',
  fontWeight: 500,
}));

export const UserEmail = styled('span')(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
}));

export const StyledAvatar = styled(MuiAvatar)(() => ({
  width: 32,
  height: 32,
}));

export const MenuIconButton = styled(MuiIconButton)(({ theme }) => ({
  marginRight: theme.spacing(1),
}));

export const MenuItemIcon = styled('span')(({ theme }) => ({
  marginRight: theme.spacing(1),
})); 