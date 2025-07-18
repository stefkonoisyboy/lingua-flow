"use client";

import { ProjectBreadcrumbs } from "@/components/projects/project-breadcrumbs";
import { useParams } from "next/navigation";
import { trpc } from "@/utils/trpc";
import {
  HeaderContent,
  PageHeader,
} from "@/styles/projects/project-details.styles";
import { Container, Typography } from "@mui/material";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: project } = trpc.projects.getProjectById.useQuery({
    projectId,
  });

  return (
    <Container maxWidth="xl">
      <PageHeader>
        <HeaderContent>
          <ProjectBreadcrumbs projectName={project?.name || ""} />

          <Typography variant="h5" fontWeight={600}>
            {project?.name}
          </Typography>
        </HeaderContent>
      </PageHeader>

      {children}
    </Container>
  );
}
