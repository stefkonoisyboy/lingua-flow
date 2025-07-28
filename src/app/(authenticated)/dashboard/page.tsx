"use client";

import { useState, Suspense } from "react";
import {
  FolderOutlined,
  LanguageOutlined,
  ErrorOutlineOutlined,
  Add,
} from "@mui/icons-material";
import StatsCard from "@/components/dashboard/stats-card";
import ProjectCard from "@/components/dashboard/project-card";
import RecentActivity from "@/components/dashboard/recent-activity";
import CreateProjectForm from "@/components/dashboard/create-project-form";
import {
  DashboardContainer,
  ProjectsSection,
  ProjectsHeader,
  CreateProjectButton,
} from "@/styles/dashboard/dashboard.styles";
import { Grid, Dialog, DialogTitle, Box } from "@mui/material";
import { trpc } from "@/utils/trpc";
import { formatDistance } from "date-fns";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setActiveTab } from "@/store/slices/project-tabs.slice";

export default function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const stats = trpc.projects.getStats.useQuery();
  const projects = trpc.projects.getProjects.useQuery();

  return (
    <DashboardContainer>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            value={stats.data?.projectsCount || 0}
            label="Total Projects"
            subtext="Ongoing localization projects"
            icon={<FolderOutlined />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            value={stats.data?.languagesCount || 0}
            label="Total Languages"
            subtext="Across all projects"
            icon={<LanguageOutlined />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            value={`${stats.data?.completionPercentage || 0}%`}
            label="Translation Completion"
            subtext={`${stats.data?.translationsCount || 0} total translations`}
            icon={<ErrorOutlineOutlined />}
            mode={
              (stats.data?.completionPercentage || 0) < 70
                ? "warning"
                : "default"
            }
          />
        </Grid>
      </Grid>

      <ProjectsSection>
        <ProjectsHeader>
          <h2>Projects Overview</h2>
          <p>Quick glance at your ongoing localization projects.</p>
          <CreateProjectButton
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsDialogOpen(true)}
          >
            Create New Project
          </CreateProjectButton>
        </ProjectsHeader>

        <Suspense fallback={<div>Loading projects...</div>}>
          <Grid container spacing={3}>
            {projects.isLoading ? (
              <Grid size={{ xs: 12 }}>
                <Box>Loading projects...</Box>
              </Grid>
            ) : projects.error ? (
              <Grid size={{ xs: 12 }}>
                <Box>Error loading projects: {projects.error.message}</Box>
              </Grid>
            ) : projects.data?.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <Box>No projects yet. Create your first project!</Box>
              </Grid>
            ) : (
              projects.data?.map((project) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project?.id}>
                  <ProjectCard
                    projectId={project?.id ?? ""}
                    title={project?.name ?? ""}
                    languages={project?.languageCount || 0}
                    missingTranslations={Math.round(
                      ((100 - (project?.progress || 0)) / 100) *
                        (project?.languageCount || 0)
                    )}
                    progress={project?.progress || 0}
                    lastUpdate={formatDistance(
                      new Date(project?.updatedAt ?? new Date()),
                      new Date(),
                      { addSuffix: true }
                    )}
                    onView={() => {
                      router.push(`/projects/${project.id}`);
                      dispatch(setActiveTab("translations"));
                    }}
                  />
                </Grid>
              ))
            )}
          </Grid>
        </Suspense>
      </ProjectsSection>

      <RecentActivity />

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
    </DashboardContainer>
  );
}
