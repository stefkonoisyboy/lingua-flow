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
import { useParams } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { hasPermission } from "@/utils/permissions";

export function ProjectTabs() {
  const params = useParams();
  const projectId = params.projectId as string;

  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(selectActiveTab);

  const { data: role } = trpc.projectMembers.getUserProjectRole.useQuery({
    projectId,
  });

  const memberRole = role?.role ?? "viewer";

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
        {hasPermission(memberRole, "viewTranslations") && (
          <Tab
            label="Translations"
            value="translations"
            icon={<TranslateIcon />}
            iconPosition="start"
          />
        )}

        {hasPermission(memberRole, "viewSettings") && (
          <Tab
            label="Settings"
            value="settings"
            icon={<SettingsIcon />}
            iconPosition="start"
          />
        )}

        {hasPermission(memberRole, "viewMembers") && (
          <Tab
            label="Collaborators"
            value="collaborators"
            icon={<GroupIcon />}
            iconPosition="start"
          />
        )}
      </StyledTabs>
    </TabsContainer>
  );
}
