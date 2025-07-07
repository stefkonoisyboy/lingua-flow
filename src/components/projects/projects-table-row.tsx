"use client";

import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useState } from "react";

import { formatDate } from "@/lib/utils/date";
import { ProjectStatusChip } from "@/components/projects/project-status-chip";
import { ProjectLanguageChip } from "@/components/projects/project-language-chip";

interface ProjectsTableRowProps {
  project: {
    id: string;
    name: string;
    status: "active" | "archived";
    languages: Array<{
      id: string;
      name: string;
      code: string;
    }>;
    missingTranslations: number;
    updatedAt: string;
  };
}

export function ProjectsTableRow({ project }: ProjectsTableRowProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent row selection when opening menu
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    handleMenuClose();
  };

  const handleSettings = () => {
    // TODO: Implement settings
    handleMenuClose();
  };

  const handleDelete = () => {
    // TODO: Implement delete
    handleMenuClose();
  };

  return (
    <TableRow hover sx={{ cursor: "pointer" }}>
      <TableCell>{project.name}</TableCell>

      <TableCell>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {project.languages.slice(0, 3).map((language) => (
            <ProjectLanguageChip key={language.id} language={language} />
          ))}

          {project.languages.length > 3 && (
            <Chip
              size="small"
              label={`+${project.languages.length - 3} more`}
              variant="outlined"
            />
          )}
        </div>
      </TableCell>

      <TableCell>
        <ProjectStatusChip status={project.status} />
      </TableCell>

      <TableCell align="center">
        <Chip
          label={project.missingTranslations}
          color={project.missingTranslations > 0 ? "error" : "success"}
          size="small"
        />
      </TableCell>

      <TableCell>{formatDate(project.updatedAt)}</TableCell>

      <TableCell align="right">
        <IconButton onClick={handleMenuOpen}>
          <MoreVertIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()} // Prevent row selection when clicking menu items
        >
          <MenuItem onClick={handleViewDetails}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
            </ListItemIcon>
            <ListItemText>Delete Project</ListItemText>
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}
