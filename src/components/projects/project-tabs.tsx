"use client";

import { Tab } from "@mui/material";
import {
  Translate as TranslateIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectActiveTab,
  setActiveTab,
  ProjectTab,
} from "@/store/slices/project-tabs.slice";
import {
  TabsContainer,
  StyledTabs,
} from "@/styles/projects/project-tabs.styles";

export function ProjectTabs() {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(selectActiveTab);

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: ProjectTab
  ) => {
    dispatch(setActiveTab(newValue));
  };

  return (
    <TabsContainer>
      <StyledTabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
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
      </StyledTabs>
    </TabsContainer>
  );
}
