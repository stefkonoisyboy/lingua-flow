"use client";

import { Tabs, Tab } from "@mui/material";
import {
  Translate as TranslateIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
} from "@mui/icons-material";

import { TabsContainer } from "@/styles/projects/project-tabs.styles";

interface ProjectTabsProps {
  activeTab: "translations" | "settings" | "collaborators";
}

export function ProjectTabs({ activeTab }: ProjectTabsProps) {
  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    // Will implement navigation later when we add other tabs
    console.log(newValue);
  };

  return (
    <TabsContainer>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        TabIndicatorProps={{
          style: { display: "none" },
        }}
      >
        <Tab
          label="Translations"
          value="translations"
          icon={<TranslateIcon />}
          iconPosition="start"
        />
        <Tab
          label="Settings"
          value="settings"
          icon={<SettingsIcon />}
          iconPosition="start"
        />
        <Tab
          label="Collaborators"
          value="collaborators"
          icon={<GroupIcon />}
          iconPosition="start"
        />
      </Tabs>
    </TabsContainer>
  );
}
