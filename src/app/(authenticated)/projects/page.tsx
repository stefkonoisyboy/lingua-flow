"use client";

import { Suspense } from "react";

import { ProjectsHeader } from "@/components/projects/projects-header";
import { ProjectsContainer } from "@/styles/projects/projects.styles";
import { ProjectsList } from "@/components/projects/projects-list";

export default function ProjectsPage() {
  return (
    <ProjectsContainer>
      <ProjectsHeader />

      <Suspense fallback={<div>Loading...</div>}>
        <ProjectsList />
      </Suspense>
    </ProjectsContainer>
  );
}
