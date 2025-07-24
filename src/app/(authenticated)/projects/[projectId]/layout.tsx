"use client";

import { ProjectBreadcrumbs } from "@/components/projects/project-breadcrumbs";
import { useParams, usePathname, useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import {
  HeaderContent,
  PageHeader,
} from "@/styles/projects/project-details.styles";
import { Container, Typography, Button, Box } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { hasPermission } from "@/utils/permissions";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.projectId as string;
  const pathname = usePathname();
  const router = useRouter();

  const { data: role } = trpc.projectMembers.getUserProjectRole.useQuery({
    projectId,
  });

  const memberRole = role?.role ?? "viewer";

  const hasProjectViewPermission = hasPermission(memberRole, "viewProject");

  const { data: project } = trpc.projects.getProjectById.useQuery(
    {
      projectId,
    },
    { enabled: hasProjectViewPermission }
  );

  const isConflictResolutionPage = pathname.includes("/conflict-resolution");

  const handleBackToProject = () => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <Container maxWidth="xl">
      <PageHeader>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <HeaderContent>
            <ProjectBreadcrumbs projectName={project?.name || ""} />

            <Typography variant="h5" fontWeight={600}>
              {project?.name}
            </Typography>
          </HeaderContent>

          {isConflictResolutionPage && (
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToProject}
            >
              Back to Project
            </Button>
          )}
        </Box>
      </PageHeader>

      {children}
    </Container>
  );
}
