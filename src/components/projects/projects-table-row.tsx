"use client";

import {
  TableCell,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { formatDate } from "@/lib/utils/date";
import { ProjectStatusChip } from "@/components/projects/project-status-chip";
import { ProjectLanguageChip } from "@/components/projects/project-language-chip";
import { trpc } from "@/utils/trpc";
import {
  StyledTableRow,
  LanguageChipsContainer,
  DeleteMenuIcon,
  DeleteMenuItem,
} from "@/styles/projects/projects-table-row.styles";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const utils = trpc.useUtils();

  const deleteProject = trpc.projects.deleteProject.useMutation({
    onSuccess: () => {
      // Invalidate queries that need to be updated
      utils.projects.getAll.invalidate();
      utils.projects.getProjects.invalidate();
      utils.projects.getStats.invalidate();
      utils.activities.getRecentActivity.invalidate();
      handleDeleteDialogClose();
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent row selection when opening menu
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    handleMenuClose();
    router.push(`/projects/${project.id}`);
  };

  const handleSettings = () => {
    // TODO: Implement settings
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    deleteProject.mutate({ projectId: project.id });
  };

  return (
    <>
      <StyledTableRow hover>
        <TableCell>{project.name}</TableCell>

        <TableCell>
          <LanguageChipsContainer>
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
          </LanguageChipsContainer>
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
            onClick={(e) => e.stopPropagation()}
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
            <DeleteMenuItem onClick={handleDeleteClick}>
              <ListItemIcon>
                <DeleteMenuIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Project</ListItemText>
            </DeleteMenuItem>
          </Menu>
        </TableCell>
      </StyledTableRow>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Project</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete &quot;{project.name}&quot;? This
            action cannot be undone and will delete all associated translations
            and data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteProject.isPending}
          >
            {deleteProject.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
