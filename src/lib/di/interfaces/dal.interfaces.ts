import { SupabaseClient } from "@supabase/supabase-js";
import { IntegrationConfig } from "../../dal/integrations";
import { Database } from "../../types/database.types";

export type TranslationInsert = {
  key_id: string;
  language_id: string;
  content: string;
  translator_id: string;
  status: "approved";
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
  ensureProjectLanguage(projectId: string, languageId: string): Promise<void>;
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

export type TranslationKey =
  Database["public"]["Tables"]["translation_keys"]["Row"];
export type Translation =
  Database["public"]["Tables"]["translations"]["Row"] & {
    translation_keys: Pick<TranslationKey, "project_id">;
  };

// TranslationsDAL Interface
export interface ITranslationsDAL {
  getTranslationKeys(
    projectId: string,
    from: number,
    to: number,
    languageId?: string,
    defaultLanguageId?: string
  ): Promise<{
    data: (Database["public"]["Tables"]["translation_keys"]["Row"] & {
      translations: Database["public"]["Tables"]["translations"]["Row"][];
    })[];
    count: number;
  }>;

  getTranslationKeyByKey(
    projectId: string,
    key: string
  ): Promise<Database["public"]["Tables"]["translation_keys"]["Row"] | null>;

  getLanguageByCode(
    code: string
  ): Promise<Database["public"]["Tables"]["languages"]["Row"]>;

  getProjectTranslationKeys(
    projectIds: string[]
  ): Promise<Database["public"]["Tables"]["translation_keys"]["Row"][]>;

  getProjectTranslations(projectIds: string[]): Promise<
    (Database["public"]["Tables"]["translations"]["Row"] & {
      translation_keys: Pick<
        Database["public"]["Tables"]["translation_keys"]["Row"],
        "project_id"
      >;
    })[]
  >;

  createTranslationKey(
    translationKey: Omit<
      Database["public"]["Tables"]["translation_keys"]["Row"],
      "id" | "created_at" | "updated_at"
    >
  ): Promise<Database["public"]["Tables"]["translation_keys"]["Row"]>;

  upsertTranslationKeys(
    keys: {
      project_id: string;
      key: string;
      description?: string;
    }[]
  ): Promise<Database["public"]["Tables"]["translation_keys"]["Row"][]>;

  upsertTranslations(
    translations: TranslationInsert[],
    userId: string,
    source: string
  ): Promise<Database["public"]["Tables"]["translations"]["Row"][]>;

  getLatestVersionNumber(translationId: string): Promise<number>;

  createTranslationKeyWithTranslations(
    projectId: string,
    key: string,
    translations: {
      languageId: string;
      content: string;
      userId: string;
    }[],
    description?: string
  ): Promise<{
    translationKey: TranslationKey;
    translations: Translation[];
  }>;

  updateTranslationKey(
    keyId: string,
    newKey: string
  ): Promise<Database["public"]["Tables"]["translation_keys"]["Row"]>;

  updateTranslation(
    translationId: string,
    content: string,
    userId: string
  ): Promise<Database["public"]["Tables"]["translations"]["Row"]>;

  createTranslation(
    keyId: string,
    languageId: string,
    content: string,
    userId: string
  ): Promise<Database["public"]["Tables"]["translations"]["Row"]>;
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
  ): Promise<
    Database["public"]["Tables"]["version_history"]["Row"] & {
      user: {
        email: string | null;
      };
    }
  >;
  getVersionHistory(translationId: string): Promise<
    (Database["public"]["Tables"]["version_history"]["Row"] & {
      user: {
        email: string | null;
      };
    })[]
  >;
  getVersionHistoryForTranslations(translationIds: string[]): Promise<
    (Database["public"]["Tables"]["version_history"]["Row"] & {
      user: {
        email: string | null;
      };
    })[]
  >;
}

export interface IGitHubTokensDAL {
  getAccessToken(userId: string): Promise<string | null>;
  saveAccessToken(userId: string, accessToken: string): Promise<void>;
}
