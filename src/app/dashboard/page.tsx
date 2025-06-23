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
import {
  DashboardContainer,
  ProjectsSection,
  ProjectsHeader,
  CreateProjectButton,
} from "@/styles/dashboard/dashboard.styles";
import {
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from "@mui/material";
import { trpc } from "@/utils/trpc";
import { formatDistance } from "date-fns";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const ProjectSchema = Yup.object().shape({
  name: Yup.string().required("Project name is required"),
  description: Yup.string(),
});

export default function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const stats = trpc.dashboard.getStats.useQuery();
  const projects = trpc.dashboard.getProjects.useQuery();
  const utils = trpc.useUtils();
  const createProject = trpc.dashboard.createProject.useMutation({
    onSuccess: () => {
      utils.dashboard.getProjects.invalidate();
      utils.dashboard.getStats.invalidate();
      utils.dashboard.getRecentActivity.invalidate();
      setIsDialogOpen(false);
    },
  });

  const handleCreateProject = (values: {
    name: string;
    description: string;
  }) => {
    createProject.mutate(values);
  };

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
                    onView={() => console.log(`View project ${project?.id}`)}
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
        <Formik
          initialValues={{ name: "", description: "" }}
          validationSchema={ProjectSchema}
          onSubmit={handleCreateProject}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                <Field
                  as={TextField}
                  name="name"
                  label="Project Name"
                  fullWidth
                  margin="normal"
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                />
                <Field
                  as={TextField}
                  name="description"
                  label="Description (Optional)"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={4}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || createProject.isPending}
                >
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </DashboardContainer>
  );
}
