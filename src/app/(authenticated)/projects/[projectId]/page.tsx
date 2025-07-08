"use client";

import { Box, Typography } from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";

import { ProjectBreadcrumbs } from "@/components/projects/project-breadcrumbs";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { ProjectTranslations } from "@/components/projects/project-translations";
import { StyledContainer } from "@/styles/projects/project-translations.styles";
import {
  StyledSaveButton,
  StyledHeader,
} from "@/styles/projects/project-details.styles";

export default function ProjectDetailsPage() {
  const handleSave = () => {
    // Will implement save functionality later
    console.log("Saving changes...");
  };

  return (
    <StyledContainer elevation={0}>
      <StyledHeader>
        <Box>
          <ProjectBreadcrumbs />

          <Typography variant="h5" component="h1">
            E-commerce Platform
          </Typography>
        </Box>

        <StyledSaveButton
          variant="contained"
          color="secondary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          Save Changes
        </StyledSaveButton>
      </StyledHeader>
      <Box>
        <ProjectTabs activeTab="translations" />
        <ProjectTranslations />
      </Box>
    </StyledContainer>
  );
}
