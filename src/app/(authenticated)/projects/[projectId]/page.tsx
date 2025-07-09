"use client";

import { useState } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
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
      },
      { enabled: !!selectedLanguageId }
    );

  const { data: translationsData, isLoading: isTranslationsLoading } =
    trpc.translations.getProjectTranslations.useQuery(
      {
        projectId,
        languageId: selectedLanguageId,
        page,
        pageSize: PAGE_SIZE,
      },
      { enabled: !!selectedLanguageId }
    );

  const {
    data: defaultTranslationsData,
    isLoading: isDefaultTranslationsLoading,
  } = trpc.translations.getProjectTranslations.useQuery(
    {
      projectId,
      languageId: defaultLanguage?.language_id || "",
      page,
      pageSize: PAGE_SIZE,
    },
    { enabled: !!defaultLanguage?.language_id && !!selectedLanguageId }
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

        <Box>
          <Button
            variant="outlined"
            color="inherit"
            // TODO: Implement save changes functionality
          >
            Save Changes
          </Button>
        </Box>
      </PageHeader>

      <TabsWrapper>
        <ProjectTabs activeTab="translations" />
      </TabsWrapper>

      <ProjectTranslations
        translationKeys={translationKeysData?.data || []}
        translations={translationsData?.data || []}
        defaultLanguageTranslations={defaultTranslationsData?.data || []}
        isLoading={
          isProjectLoading ||
          isProjectLanguagesLoading ||
          isTranslationKeysLoading ||
          isTranslationsLoading ||
          isDefaultTranslationsLoading
        }
        defaultLanguageName={
          projectLanguages?.find((lang) => lang.is_default)?.languages?.name ||
          ""
        }
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
      />
    </Container>
  );
}
