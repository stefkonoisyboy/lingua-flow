"use client";

import { Suspense } from "react";
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
import { Grid } from "@mui/material";

const mockProjects = [
  {
    id: 1,
    title: "E-commerce Platform",
    languages: 5,
    missingTranslations: 12,
    progress: 75,
    lastUpdate: "2 hours ago",
  },
  {
    id: 2,
    title: "Mobile App Backend",
    languages: 3,
    missingTranslations: 3,
    progress: 90,
    lastUpdate: "1 day ago",
  },
  {
    id: 3,
    title: "Marketing Website",
    languages: 2,
    missingTranslations: 35,
    progress: 45,
    lastUpdate: "3 days ago",
  },
];

export default function DashboardPage() {
  return (
    <DashboardContainer>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            value={3}
            label="Total Projects"
            subtext="+2 since last month"
            icon={<FolderOutlined />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            value={10}
            label="Total Languages Managed"
            subtext="Across all projects"
            icon={<LanguageOutlined />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            value={50}
            label="Missing Translations"
            subtext="Needs immediate attention"
            icon={<ErrorOutlineOutlined />}
            mode="warning"
          />
        </Grid>
      </Grid>

      <ProjectsSection>
        <ProjectsHeader>
          <h2>Projects Overview</h2>
          <p>Quick glance at your ongoing localization projects.</p>
          <CreateProjectButton variant="contained" startIcon={<Add />}>
            Create New Project
          </CreateProjectButton>
        </ProjectsHeader>

        <Suspense fallback={<div>Loading projects...</div>}>
          <Grid container spacing={3}>
            {mockProjects.map((project) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
                <ProjectCard
                  key={project.id}
                  title={project.title}
                  languages={project.languages}
                  missingTranslations={project.missingTranslations}
                  progress={project.progress}
                  lastUpdate={project.lastUpdate}
                  onView={() => console.log(`View project ${project.id}`)}
                />
              </Grid>
            ))}
          </Grid>
        </Suspense>
      </ProjectsSection>

      <RecentActivity />
    </DashboardContainer>
  );
}
