"use client";

import { Breadcrumbs, Link, Typography } from "@mui/material";
import NextLink from "next/link";

import { StyledBreadcrumbsContainer } from "@/styles/projects/project-breadcrumbs.styles";

export function ProjectBreadcrumbs() {
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
        <Typography color="primary">E-commerce Platform</Typography>
      </Breadcrumbs>
    </StyledBreadcrumbsContainer>
  );
}
