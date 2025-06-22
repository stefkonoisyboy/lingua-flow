"use client";

import { useState } from "react";
import {
  NotificationsOutlined,
  KeyboardArrowDown,
  LogoutOutlined,
  PersonOutlineOutlined,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { Badge, Menu, MenuItem, useMediaQuery, useTheme } from "@mui/material";
import { useAuth } from "@/hooks/use-auth";
import {
  TopbarContainer,
  UserSection,
  UserInfo,
  UserName,
  StyledAvatar,
  MenuIconButton,
  MenuItemIcon,
  RightSection,
} from "@/styles/layout/topbar.styles";

interface TopbarProps {
  onMenuClick?: () => void;
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOut();
    handleCloseMenu();
  };

  return (
    <TopbarContainer>
      {isMobile && (
        <MenuIconButton onClick={onMenuClick} size="small" edge="start">
          <MenuIcon />
        </MenuIconButton>
      )}

      <RightSection>
        <MenuIconButton size="small">
          <Badge badgeContent={3} color="error">
            <NotificationsOutlined />
          </Badge>
        </MenuIconButton>

        <UserSection onClick={handleOpenMenu}>
          <StyledAvatar src={user?.user_metadata?.avatar_url}>
            {user?.email?.[0].toUpperCase()}
          </StyledAvatar>
          <UserInfo>
            <UserName>{user?.email || "User"}</UserName>
          </UserInfo>
          <KeyboardArrowDown />
        </UserSection>

        <Menu
          disableScrollLock
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={handleCloseMenu}>
            <MenuItemIcon>
              <PersonOutlineOutlined />
            </MenuItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <MenuItemIcon>
              <LogoutOutlined />
            </MenuItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </RightSection>
    </TopbarContainer>
  );
};

export default Topbar;
