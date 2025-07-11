"use client";

import { useState } from "react";
import { Container, Typography } from "@mui/material";
import { ProjectBreadcrumbs } from "@/components/projects/project-breadcrumbs";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { ProjectTranslations } from "@/components/projects/project-translations";
import { useParams } from "next/navigation";
import { trpc } from "@/utils/trpc";
import {
  PageHeader,
  HeaderContent,
  TabsWrapper,
} from "@/styles/projects/project-details.styles";

const PAGE_SIZE = 10;

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data: project, isLoading: isProjectLoading } =
    trpc.projects.getProjectById.useQuery({
      projectId,
    });

  const { data: projectLanguages, isLoading: isProjectLanguagesLoading } =
    trpc.projects.getProjectLanguages.useQuery({ projectId });

  const defaultLanguage = projectLanguages?.find((lang) => lang.is_default);

  const { data: translationKeysData, isLoading: isTranslationKeysLoading } =
    trpc.translations.getTranslationKeys.useQuery(
      {
        projectId,
        page,
        pageSize: PAGE_SIZE,
        languageId: selectedLanguageId,
        defaultLanguageId: defaultLanguage?.language_id,
      },
      { enabled: !!selectedLanguageId && !!defaultLanguage?.language_id }
    );

  const totalPages = Math.ceil((translationKeysData?.total || 0) / PAGE_SIZE);

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

      <TabsWrapper>
        <ProjectTabs activeTab="translations" />
      </TabsWrapper>

      <ProjectTranslations
        translationKeys={translationKeysData?.data || []}
        isLoading={
          isProjectLoading ||
          isProjectLanguagesLoading ||
          isTranslationKeysLoading
        }
        defaultLanguageName={
          projectLanguages?.find((lang) => lang.is_default)?.languages?.name ||
          ""
        }
        defaultLanguageId={defaultLanguage?.language_id || ""}
        languageName={
          projectLanguages?.find(
            (lang) => lang.language_id === selectedLanguageId
          )?.languages?.name || ""
        }
        selectedLanguageId={selectedLanguageId}
        onLanguageChange={setSelectedLanguageId}
        languages={projectLanguages || []}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        projectId={projectId}
      />
    </Container>
  );
}
