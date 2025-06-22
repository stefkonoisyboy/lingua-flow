"use client";

import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import {
  LayoutContainer,
  MainContent,
} from "@/styles/layout/dashboard-layout.styles";
import { useTheme } from "@/providers/theme-provider";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleColorMode } = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <LayoutContainer>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={handleDrawerToggle}
        onToggleTheme={toggleColorMode}
        isDarkMode={theme === "dark"}
      />
      <MainContent>
        <Topbar onMenuClick={handleDrawerToggle} />
        {children}
      </MainContent>
    </LayoutContainer>
  );
};

export default DashboardLayout;
