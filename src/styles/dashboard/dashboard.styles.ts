import { Container, Typography, Button } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

export const HeaderContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(4),
}));

export const StyledTitle = styled(Typography)(() => ({
  margin: 0,
}));

export const LogoutButton = styled(Button)(() => ({
  marginLeft: "16px",
}));

export const DashboardContainer = styled('div')(({ theme }) => ({
  padding: theme.spacing(3),
  width: '100%',
  maxWidth: '100%',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

export const DashboardContent = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 300px',
  gap: theme.spacing(3),
  [theme.breakpoints.down('lg')]: {
    gridTemplateColumns: '1fr',
  },
}));

export const MainContent = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

export const Sidebar = styled('div')(({ theme }) => ({
  [theme.breakpoints.down('lg')]: {
    gridRow: 1,
  },
}));

export const StatsGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
    gap: theme.spacing(2),
  },
}));

export const ProjectsSection = styled('section')(() => ({
  width: '100%',
}));

export const ProjectsHeader = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& h2': {
    fontSize: '1.25rem',
    fontWeight: 500,
    marginBottom: theme.spacing(1),
  },
  '& p': {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    marginBottom: theme.spacing(2),
  },
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(2),
  },
}));

export const ProjectsGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
    gap: theme.spacing(2),
  },
}));

export const CreateProjectButton = styled(Button)(() => ({
  textTransform: 'none',
}));
