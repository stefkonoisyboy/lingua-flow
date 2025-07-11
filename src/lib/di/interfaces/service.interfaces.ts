import { Database } from "../../types/database.types";
import { IntegrationConfig } from "../../dal/integrations";
import {
  Repository,
  Branch,
  TranslationFile,
} from "../../services/github.service";
import { Translation, TranslationKey } from "./dal.interfaces";

// Project service interfaces
export interface ProjectStats {
  projectsCount: number;
  languagesCount: number;
  translationsCount: number;
  completionPercentage: number;
}

export interface ProjectLanguage {
  id: string;
  name: string;
  code: string;
  flagUrl: string | null;
  isRtl: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  languageCount: number;
  languages: ProjectLanguage[];
  progress: number;
  updatedAt: string;
}

export interface GitHubConfig {
  repository: string;
  branch: string;
  translationPath?: string;
  filePattern?: string;
  [key: string]: string | undefined;
}

export interface RecentActivity {
  id: string;
  type: string;
  details: Record<string, unknown> | null;
  projectName: string;
  projectId: string;
  resourceId: string | null;
  resourceType: string | null;
  timestamp: string;
}

export interface IProjectsService {
  getProjectStats(userId: string): Promise<ProjectStats>;
  getProjects(userId: string): Promise<Project[]>;
  createProject(
    name: string,
    description: string | undefined,
    userId: string,
    defaultLanguageId: string,
    githubConfig?: GitHubConfig
  ): Promise<Project>;
  getRecentActivity(userId: string): Promise<RecentActivity[]>;
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
  deleteProject(projectId: string): Promise<void>;
  getProjectById(
    projectId: string
  ): Promise<Database["public"]["Tables"]["projects"]["Row"] | null>;
  getProjectLanguages(projectId: string): Promise<
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
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

export interface ITranslationsService {
  getTranslationKeys(
    projectId: string,
    page?: number,
    pageSize?: number,
    languageId?: string,
    defaultLanguageId?: string
  ): Promise<
    PaginatedResponse<
      TranslationKey & {
        translations: Database["public"]["Tables"]["translations"]["Row"][];
      }
    >
  >;

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

  getLatestVersionNumber(translationId: string): Promise<number>;

  updateTranslationKey(keyId: string, newKey: string): Promise<TranslationKey>;

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

// Languages service interface
export interface Language {
  id: string;
  name: string;
  code: string;
  flagUrl: string | null;
  isRtl: boolean;
}

export interface ILanguagesService {
  getAllLanguages(): Promise<Language[]>;
}

// Integrations service interface
export interface IIntegrationsService {
  createGitHubIntegration(
    projectId: string,
    config: GitHubConfig
  ): Promise<void>;
  getProjectIntegration(
    projectId: string
  ): Promise<Database["public"]["Tables"]["project_integrations"]["Row"]>;
  listRepositories(accessToken: string): Promise<Repository[]>;
  listBranches(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<Branch[]>;
  importTranslations(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string,
    files: TranslationFile[]
  ): Promise<{ [key: string]: string }>;
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
  importProjectTranslations(
    projectId: string,
    accessToken: string,
    repository: string,
    branch: string,
    files: TranslationFile[],
    userId: string
  ): Promise<{ success: boolean }>;
}

export interface IGitHubTokensService {
  getAccessToken(userId: string): Promise<string | null>;
  saveAccessToken(userId: string, accessToken: string): Promise<void>;
}

export interface IVersionHistoryService {
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
}
