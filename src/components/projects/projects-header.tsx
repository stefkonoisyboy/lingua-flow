"use client";

import { Add as AddIcon } from "@mui/icons-material";

import {
  ProjectsHeaderContainer,
  ProjectsHeaderTitle,
  CreateProjectButton,
} from "@/styles/projects/projects-header.styles";
import { Dialog, DialogTitle } from "@mui/material";
import { useState } from "react";
import CreateProjectForm from "../dashboard/create-project-form";

export function ProjectsHeader() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateProject = () => {
    setIsDialogOpen(true);
  };

  return (
    <ProjectsHeaderContainer>
      <ProjectsHeaderTitle variant="h4">Projects</ProjectsHeaderTitle>

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
    </ProjectsHeaderContainer>
  );
}
