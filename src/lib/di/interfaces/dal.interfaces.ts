import { IntegrationConfig } from "../../dal/integrations";
import { TranslationInsert } from "../../dal/translations";
import { Database } from "../../types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

type Tables = Database["public"]["Tables"];

// Custom types for joined queries
type ProjectWithLanguages = {
  project_id: string;
  language_id: string;
  languages: Pick<
    Tables["languages"]["Row"],
    "id" | "name" | "code" | "flag_url" | "is_rtl"
  >;
};

type ProjectWithDetails = {
  project_id: string;
  projects: Tables["projects"]["Row"];
};

// ProjectsDAL Interface
export interface IProjectsDAL {
  getProjectsForUser(userId: string): Promise<ProjectWithDetails[]>;
  getProjectLanguages(projectIds: string[]): Promise<ProjectWithLanguages[]>;
  getProjectMemberProjects(userId: string): Promise<{ project_id: string }[]>;
  createProject(
    name: string,
    description: string | undefined,
    userId: string,
    defaultLanguageId: string
  ): Promise<Tables["projects"]["Row"]>;
  addProjectMember(
    projectId: string,
    userId: string,
    role: Database["public"]["Enums"]["user_role"]
  ): Promise<void>;
  addProjectLanguage(
    projectId: string,
    languageId: string,
    isDefault: boolean
  ): Promise<void>;
  getProjectLanguage(
    projectId: string,
    languageId: string
  ): Promise<Tables["project_languages"]["Row"] | null>;
  ensureProjectLanguage(projectId: string, languageId: string): Promise<void>;
}

// ActivitiesDAL Interface
export interface IActivitiesDAL {
  logActivity(
    projectId: string,
    userId: string,
    activityType: Database["public"]["Enums"]["activity_type"],
    details: Record<string, unknown>
  ): Promise<void>;
  getRecentActivities(projectIds: string[]): Promise<
    (Tables["activity_log"]["Row"] & {
      projects: Pick<Tables["projects"]["Row"], "id" | "name">;
    })[]
  >;
}

// TranslationsDAL Interface
export interface ITranslationsDAL {
  getProjectTranslations(projectIds: string[]): Promise<
    (Tables["translations"]["Row"] & {
      translation_keys: Pick<Tables["translation_keys"]["Row"], "project_id">;
    })[]
  >;
  upsertTranslationKeys(
    keys: { project_id: string; key: string; description?: string }[]
  ): Promise<Tables["translation_keys"]["Row"][]>;
  upsertTranslations(
    translations: TranslationInsert[],
    userId: string,
    source: string
  ): Promise<Tables["translations"]["Row"][]>;
  getLanguageByCode(code: string): Promise<Tables["languages"]["Row"]>;
}

// IntegrationsDAL Interface
export interface IIntegrationsDAL {
  createGitHubIntegration(
    projectId: string,
    config: {
      repository: string;
      branch: string;
      translationPath?: string;
      filePattern?: string;
    }
  ): Promise<Tables["project_integrations"]["Row"]>;
  getProjectIntegration(
    projectId: string
  ): Promise<Tables["project_integrations"]["Row"]>;
  updateIntegrationConfig(
    integrationId: string,
    config: Partial<IntegrationConfig>
  ): Promise<Tables["project_integrations"]["Row"]>;
  updateIntegrationStatus(
    integrationId: string,
    isConnected: boolean,
    lastSyncedAt?: string
  ): Promise<Tables["project_integrations"]["Row"]>;
  deleteIntegration(integrationId: string): Promise<void>;
}

// LanguagesDAL Interface
export interface ILanguagesDAL {
  getAllLanguages(): Promise<Tables["languages"]["Row"][]>;
}

export interface IPaginationDAL {
  fetchAllPages<T>(
    query: ReturnType<SupabaseClient<Database>["from"]>,
    pageSize?: number
  ): Promise<T[]>;
}

export interface IVersionHistoryDAL {
  createVersion(
    translationId: string,
    content: string,
    changedBy: string,
    versionName: string
  ): Promise<Tables["version_history"]["Row"]>;

  getVersionHistory(
    translationId: string
  ): Promise<Tables["version_history"]["Row"][]>;

  getVersionHistoryForTranslations(
    translationIds: string[]
  ): Promise<Tables["version_history"]["Row"][]>;
}
