"use client";

import { useState, useEffect } from "react";
import { Container, Typography } from "@mui/material";
import { ProjectBreadcrumbs } from "@/components/projects/project-breadcrumbs";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { ProjectTranslations } from "@/components/projects/project-translations";
import { ProjectSettings } from "@/components/projects/project-settings";
import { useParams } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectActiveTab } from "@/store/slices/project-tabs.slice";
import {
  selectSelectedLanguageId,
  setSelectedLanguageId,
} from "@/store/slices/selected-language.slice";
import {
  PageHeader,
  HeaderContent,
  TabsWrapper,
} from "@/styles/projects/project-details.styles";

const PAGE_SIZE = 10;

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [page, setPage] = useState(1);
  const dispatch = useAppDispatch();

  // Get active tab from Redux
  const activeTab = useAppSelector(selectActiveTab);
  const selectedLanguageId = useAppSelector(selectSelectedLanguageId);

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
      {
        enabled:
          !!selectedLanguageId &&
          !!defaultLanguage?.language_id &&
          activeTab === "translations",
      }
    );

  const totalPages = Math.ceil((translationKeysData?.total || 0) / PAGE_SIZE);

  // Set selected language to default language when project languages load
  useEffect(() => {
    if (defaultLanguage && !selectedLanguageId) {
      dispatch(setSelectedLanguageId(defaultLanguage.language_id));
    }
  }, [defaultLanguage, selectedLanguageId, dispatch]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "settings":
        return (
          <ProjectSettings
            projectId={projectId}
            initialName={project?.name || ""}
            initialDescription={project?.description || ""}
            languages={projectLanguages || []}
          />
        );
      case "translations":
        return (
          <ProjectTranslations
            translationKeys={translationKeysData?.data || []}
            isLoading={
              isProjectLoading ||
              isProjectLanguagesLoading ||
              isTranslationKeysLoading
            }
            defaultLanguageName={
              projectLanguages?.find((lang) => lang.is_default)?.languages
                ?.name || ""
            }
            defaultLanguageId={defaultLanguage?.language_id || ""}
            languageName={
              projectLanguages?.find(
                (lang) => lang.language_id === selectedLanguageId
              )?.languages?.name || ""
            }
            languages={projectLanguages || []}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            projectId={projectId}
          />
        );
      case "collaborators":
        // Will be implemented later
        return (
          <Typography variant="h6" sx={{ mt: 4, textAlign: "center" }}>
            Collaborators feature coming soon
          </Typography>
        );
      default:
        return null;
    }
  };

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
        <ProjectTabs />
      </TabsWrapper>

      {renderTabContent()}
    </Container>
  );
}
