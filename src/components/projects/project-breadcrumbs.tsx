"use client";

import { Breadcrumbs, Link, Typography } from "@mui/material";
import NextLink from "next/link";
import { usePathname, useParams } from "next/navigation";
import { StyledBreadcrumbsContainer } from "@/styles/projects/project-breadcrumbs.styles";

export function ProjectBreadcrumbs({ projectName }: { projectName: string }) {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.projectId as string;

  // Build breadcrumb segments
  // Example: /projects/123/conflict-resolution
  const segments = pathname.split("/").filter(Boolean);
  type Crumb = { label: string; href?: string };

  const breadcrumbs: Crumb[] = [
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: projectName || projectId,
      href: `/projects/${projectId}`,
    },
  ];

  // Add subpage if present
  if (segments.length > 2 && segments[2] !== projectId) {
    // e.g., ['projects', '123', 'conflict-resolution']
    const subpage = segments.slice(3).join("/") || segments[2];

    let subpageLabel = subpage
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    if (subpage === "conflict-resolution") {
      subpageLabel = "Conflict Resolution";
    }

    breadcrumbs.push({ label: subpageLabel });
  }

  return (
    <StyledBreadcrumbsContainer>
      <Breadcrumbs aria-label="breadcrumb">
        {breadcrumbs.map((crumb, idx) =>
          crumb.href && idx !== breadcrumbs.length - 1 ? (
            <Link
              key={crumb.label}
              component={NextLink}
              href={crumb.href}
              underline="hover"
              color="inherit"
            >
              {crumb.label}
            </Link>
          ) : (
            <Typography key={crumb.label} color="primary">
              {crumb.label}
            </Typography>
          )
        )}
      </Breadcrumbs>
    </StyledBreadcrumbsContainer>
  );
}
