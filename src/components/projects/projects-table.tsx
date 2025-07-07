"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useState } from "react";

import { ProjectsTableRow } from "@/components/projects/projects-table-row";
import { ProjectsTableContainer } from "@/styles/projects/projects-table.styles";
import { trpc } from "@/utils/trpc";
import { CreateProjectButton } from "@/styles/dashboard/dashboard.styles";
import CreateProjectForm from "../dashboard/create-project-form";
import {
  EmptyProjectsContainer,
  EmptyProjectsIcon,
  EmptyProjectsDescription,
} from "@/styles/projects/empty-projects.styles";

function EmptyProjectsPlaceholder() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateProject = () => {
    setIsDialogOpen(true);
  };

  return (
    <EmptyProjectsContainer>
      <EmptyProjectsIcon />

      <Typography variant="h6" color="text.primary" gutterBottom>
        No Projects Yet
      </Typography>

      <EmptyProjectsDescription>
        <Typography variant="body1" color="text.secondary">
          Get started by creating your first localization project! You can
          manage all your translations from one place!
        </Typography>
      </EmptyProjectsDescription>

      <CreateProjectButton
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleCreateProject}
      >
        Create New Project
      </CreateProjectButton>

      {/* Create Project Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Project</DialogTitle>
        <CreateProjectForm onClose={() => setIsDialogOpen(false)} />
      </Dialog>
    </EmptyProjectsContainer>
  );
}

export function ProjectsTable() {
  const { data: projects, isLoading } = trpc.projects.getAll.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!projects?.length) {
    return (
      <ProjectsTableContainer>
        <EmptyProjectsPlaceholder />
      </ProjectsTableContainer>
    );
  }

  return (
    <ProjectsTableContainer>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Languages</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Missing</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {projects.map((project) => (
              <ProjectsTableRow key={project.id} project={project} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </ProjectsTableContainer>
  );
}
