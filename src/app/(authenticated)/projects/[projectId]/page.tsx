"use client";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ProjectTranslations } from "@/components/projects/project-translations";
import { ProjectSettings } from "@/components/projects/project-settings";
import { CollaboratorsSection } from "@/components/projects/collaborators/collaborators-section";
import { useAppSelector } from "@/store/hooks";
import { selectActiveTab } from "@/store/slices/project-tabs.slice";

import { TabsWrapper } from "@/styles/projects/project-details.styles";

export default function ProjectDetailsPage() {
  // Get active tab from Redux
  const activeTab = useAppSelector(selectActiveTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case "settings":
        return <ProjectSettings />;
      case "translations":
        return <ProjectTranslations />;
      case "collaborators":
        return <CollaboratorsSection />;
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
