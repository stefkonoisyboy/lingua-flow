import { IntegrationConfig } from "../../dal/integrations";
import { Database } from "../../types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

type Translation = Database["public"]["Tables"]["translations"]["Row"] & {
  translation_keys: Pick<
    Database["public"]["Tables"]["translation_keys"]["Row"],
    "project_id"
  >;
};

// Custom types for joined queries
export type ProjectWithLanguages =
  Database["public"]["Tables"]["project_languages"]["Row"] & {
    languages: Database["public"]["Tables"]["languages"]["Row"];
  };

export type ProjectWithDetails =
  Database["public"]["Tables"]["projects"]["Row"] & {
    languages: Array<{
      id: string;
      name: string;
      code: string;
    }>;
    missingTranslations: number;
  };

// ProjectsDAL Interface
export interface IProjectsDAL {
  getProjectsForUser(userId: string): Promise<ProjectWithDetails[]>;
  getProjectLanguages(projectIds: string[]): Promise<ProjectWithLanguages[]>;
  getProjectLanguagesById(projectId: string): Promise<
    {
      created_at: string;
      is_default: boolean;
      language_id: string;
      project_id: string;
      updated_at: string;
      languages: {
        code: string;
        created_at: string;
        flag_url: string | null;
        id: string;
        is_rtl: boolean;
        name: string;
        updated_at: string;
      };
    }[]
  >;
  getProjectMemberProjects(userId: string): Promise<{ project_id: string }[]>;
  createProject(
    project: Omit<
      Database["public"]["Tables"]["projects"]["Row"],
      "id" | "created_at" | "updated_at"
    >
  ): Promise<Database["public"]["Tables"]["projects"]["Row"]>;
  deleteProject(projectId: string): Promise<void>;
  getProjectById(
    projectId: string
  ): Promise<Database["public"]["Tables"]["projects"]["Row"] | null>;
  addProjectLanguage(
    projectId: string,
    languageId: string,
    isDefault: boolean
  ): Promise<void>;
  addProjectMember(
    projectId: string,
    userId: string,
    role: Database["public"]["Enums"]["user_role"]
  ): Promise<void>;
  getAll(userId: string): Promise<
    {
      id: string;
      name: string;
      status: "active" | "archived";
      languages: Array<{
        id: string;
        name: string;
        code: string;
      }>;
      missingTranslations: number;
      updatedAt: string;
    }[]
  >;
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
    (Database["public"]["Tables"]["activity_log"]["Row"] & {
      projects: Pick<
        Database["public"]["Tables"]["projects"]["Row"],
        "id" | "name"
      >;
    })[]
  >;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
}

// TranslationsDAL Interface
export interface ITranslationsDAL {
  getProjectTranslations(projectIds: string[]): Promise<Translation[]>;
  getProjectTranslationsById(
    projectId: string,
    languageId: string,
    from: number,
    to: number
  ): Promise<
    PaginatedResult<Database["public"]["Tables"]["translations"]["Row"]>
  >;
  getProjectTranslationKeys(
    projectIds: string[]
  ): Promise<Database["public"]["Tables"]["translation_keys"]["Row"][]>;
  getTranslationKeyByKey(
    projectId: string,
    key: string
  ): Promise<Database["public"]["Tables"]["translation_keys"]["Row"] | null>;
  getLanguageByCode(
    code: string
  ): Promise<Database["public"]["Tables"]["languages"]["Row"]>;
  upsertTranslationKeys(
    keys: {
      project_id: string;
      key: string;
      description?: string;
    }[]
  ): Promise<Database["public"]["Tables"]["translation_keys"]["Row"][]>;
  upsertTranslations(
    translations: {
      key_id: string;
      language_id: string;
      content: string;
      translator_id: string;
      status: "approved";
    }[],
    userId: string,
    source: string
  ): Promise<Database["public"]["Tables"]["translations"]["Row"][]>;
  createTranslationKey(
    translationKey: Omit<
      Database["public"]["Tables"]["translation_keys"]["Row"],
      "id" | "created_at" | "updated_at"
    >
  ): Promise<Database["public"]["Tables"]["translation_keys"]["Row"]>;
  getTranslationKeys(
    projectId: string,
    from: number,
    to: number
  ): Promise<
    PaginatedResult<Database["public"]["Tables"]["translation_keys"]["Row"]>
  >;
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
  ): Promise<Database["public"]["Tables"]["project_integrations"]["Row"]>;
  getProjectIntegration(
    projectId: string
  ): Promise<Database["public"]["Tables"]["project_integrations"]["Row"]>;
  updateIntegrationConfig(
    integrationId: string,
    config: Partial<IntegrationConfig>
  ): Promise<Database["public"]["Tables"]["project_integrations"]["Row"]>;
  updateIntegrationStatus(
    integrationId: string,
    isConnected: boolean,
    lastSyncedAt?: string
  ): Promise<Database["public"]["Tables"]["project_integrations"]["Row"]>;
  deleteIntegration(integrationId: string): Promise<void>;
}

// LanguagesDAL Interface
export interface ILanguagesDAL {
  getAllLanguages(): Promise<
    Database["public"]["Tables"]["languages"]["Row"][]
  >;
}

export interface IPaginationDAL {
  fetchAllPages<T>(
    query: SupabaseClient<Database>["from"]["prototype"]["select"],
    pageSize: number
  ): Promise<T[]>;
}

export interface IVersionHistoryDAL {
  createVersion(
    translationId: string,
    content: string,
    changedBy: string,
    versionName: string
  ): Promise<Database["public"]["Tables"]["version_history"]["Row"]>;

  getVersionHistory(
    translationId: string
  ): Promise<Database["public"]["Tables"]["version_history"]["Row"][]>;

  getVersionHistoryForTranslations(
    translationIds: string[]
  ): Promise<Database["public"]["Tables"]["version_history"]["Row"][]>;
}

export interface IGitHubTokensDAL {
  getAccessToken(userId: string): Promise<string | null>;
  saveAccessToken(userId: string, accessToken: string): Promise<void>;
}
