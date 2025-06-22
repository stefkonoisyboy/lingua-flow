import { styled } from '@mui/material/styles';
import { Drawer, IconButton } from '@mui/material';
import Link from 'next/link';

const SIDEBAR_WIDTH = 280;

export const SidebarContainer = styled(Drawer)(({ theme }) => ({
  width: SIDEBAR_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: SIDEBAR_WIDTH,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('md')]: {
      position: 'fixed',
      height: '100vh',
      top: 0,
      left: 0,
    },
  },
}));

export const LogoContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const NavList = styled('ul')(({ theme }) => ({
  listStyle: 'none',
  padding: theme.spacing(2, 0),
  margin: 0,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
}));

export const BottomNavList = styled('ul')(({ theme }) => ({
  listStyle: 'none',
  padding: theme.spacing(2, 0),
  margin: 0,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

export const NavItem = styled('li')(() => ({
  width: '100%',
}));

export const NavLink = styled('div')<{ active?: boolean }>(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5, 2),
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  backgroundColor: active ? theme.palette.action.selected : 'transparent',
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0.5, 1),
  transition: theme.transitions.create(['background-color', 'color'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

export const NavIcon = styled('span')(({ }) => ({
  minWidth: 40,
  color: 'inherit',
  display: 'flex',
  alignItems: 'center',
}));

export const NavText = styled('span')(() => ({
  flex: 1,
}));

export const MenuButton = styled(IconButton)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

export const StyledLink = styled(Link)(() => ({
  textDecoration: 'none',
  color: 'inherit',
}));

export const ThemeToggleContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5, 2),
  margin: theme.spacing(0.5, 1),
  color: theme.palette.text.primary,
  '& .MuiSwitch-root': {
    marginLeft: 'auto',
  },
}));