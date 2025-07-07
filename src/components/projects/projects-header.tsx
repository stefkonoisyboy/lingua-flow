"use client";

import { Add as AddIcon } from "@mui/icons-material";

import {
  ProjectsHeaderContainer,
  ProjectsHeaderTitle,
  CreateProjectButton,
} from "@/styles/projects/projects-header.styles";

export function ProjectsHeader() {
  const handleCreateProject = () => {
    // TODO: Implement create project dialog
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
    </ProjectsHeaderContainer>
  );
}
