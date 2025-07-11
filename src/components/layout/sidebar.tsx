"use client";

import { usePathname } from "next/navigation";
import { useTheme, useMediaQuery, Switch } from "@mui/material";
import {
  DashboardOutlined,
  FolderOutlined,
  SettingsOutlined,
  Menu as MenuIcon,
  LightMode,
  DarkMode,
} from "@mui/icons-material";
import {
  SidebarContainer,
  LogoContainer,
  NavList,
  BottomNavList,
  NavItem,
  NavLink,
  NavIcon,
  NavText,
  MenuButton,
  StyledLink,
  ThemeToggleContainer,
} from "@/styles/layout/sidebar.styles";
import Logo from "../logo";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

const mainNavigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <DashboardOutlined />,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: <FolderOutlined />,
  },
];

const Sidebar = ({
  mobileOpen,
  onMobileClose,
  onToggleTheme,
  isDarkMode,
}: SidebarProps) => {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const drawerContent = (
    <>
      <LogoContainer>
        <Logo />
        {isMobile && (
          <MenuButton onClick={onMobileClose}>
            <MenuIcon />
          </MenuButton>
        )}
      </LogoContainer>

      <NavList>
        {mainNavigationItems.map((item) => (
          <NavItem key={item.href}>
            <StyledLink href={item.href}>
              <NavLink
                active={
                  pathname === item.href || pathname.startsWith(item.href)
                }
                onClick={isMobile ? onMobileClose : undefined}
              >
                <NavIcon>{item.icon}</NavIcon>
                <NavText>{item.label}</NavText>
              </NavLink>
            </StyledLink>
          </NavItem>
        ))}
      </NavList>

      <BottomNavList>
        <NavItem>
          <StyledLink href="/settings">
            <NavLink
              active={pathname === "/settings"}
              onClick={isMobile ? onMobileClose : undefined}
            >
              <NavIcon>
                <SettingsOutlined />
              </NavIcon>
              <NavText>Settings</NavText>
            </NavLink>
          </StyledLink>
        </NavItem>
        <NavItem>
          <ThemeToggleContainer>
            <NavIcon>{isDarkMode ? <DarkMode /> : <LightMode />}</NavIcon>
            <NavText>Theme</NavText>
            <Switch
              checked={isDarkMode}
              onChange={onToggleTheme}
              color="primary"
            />
          </ThemeToggleContainer>
        </NavItem>
      </BottomNavList>
    </>
  );

  return (
    <SidebarContainer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={onMobileClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
    >
      {drawerContent}
    </SidebarContainer>
  );
};

export default Sidebar;
