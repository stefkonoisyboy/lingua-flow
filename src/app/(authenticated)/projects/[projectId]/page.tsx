"use client";

import { useState, useEffect } from "react";
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
  TabsWrapper,
  ComingSoonText,
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
        return <ProjectSettings languages={projectLanguages || []} />;
      case "translations":
        return (
          <ProjectTranslations
            translationKeys={translationKeysData?.data || []}
            isLoading={isProjectLanguagesLoading || isTranslationKeysLoading}
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
        return (
          <ComingSoonText variant="h6">
            Collaborators feature coming soon
          </ComingSoonText>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <TabsWrapper>
        <ProjectTabs />
      </TabsWrapper>

      {renderTabContent()}
    </>
  );
}
