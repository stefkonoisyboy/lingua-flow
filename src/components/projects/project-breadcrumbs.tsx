"use client";

import { Breadcrumbs, Link, Typography } from "@mui/material";
import NextLink from "next/link";

import { StyledBreadcrumbsContainer } from "@/styles/projects/project-breadcrumbs.styles";

export function ProjectBreadcrumbs({ projectName }: { projectName: string }) {
  return (
    <StyledBreadcrumbsContainer>
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          component={NextLink}
          href="/projects"
          underline="hover"
          color="inherit"
        >
          Projects
        </Link>
        <Typography color="primary">{projectName}</Typography>
      </Breadcrumbs>
    </StyledBreadcrumbsContainer>
  );
}
