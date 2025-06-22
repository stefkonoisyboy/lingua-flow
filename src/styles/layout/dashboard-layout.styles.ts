import { styled } from '@mui/material/styles';

const SIDEBAR_WIDTH = 280;
const TOPBAR_HEIGHT = 64;
const MOBILE_TOPBAR_HEIGHT = 56;

export const LayoutContainer = styled('div')({
  minHeight: '100vh',
  display: 'flex',
  width: '100%',
  position: 'relative',
});

export const MainContent = styled('main')(({ theme }) => ({
  flexGrow: 1,
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  paddingTop: TOPBAR_HEIGHT,
  width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
  transition: theme.transitions.create(['width', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down('md')]: {
    paddingTop: MOBILE_TOPBAR_HEIGHT,
    width: '100%',
  },
})); 