import { Database, Json } from "../../types/database.types";
import { IntegrationConfig } from "../../dal/integrations";
import {
  Repository,
  Branch,
  TranslationFile,
} from "../../services/github.service";
import {
  CreateSyncHistoryParamsDAL,
  Translation,
  TranslationKey,
  UserRole,
  ProjectMemberWithProfile,
  ProjectInvitation,
  Profile,
} from "./dal.interfaces";

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
  updateProject(
    projectId: string,
    userId: string,
    name: string,
    description?: string | null
  ): Promise<Database["public"]["Tables"]["projects"]["Row"]>;

  addProjectLanguage(
    projectId: string,
    languageId: string,
    userId: string
  ): Promise<void>;

  removeProjectLanguage(
    projectId: string,
    languageId: string,
    userId: string
  ): Promise<void>;

  setDefaultLanguage(
    projectId: string,
    languageId: string,
    userId: string
  ): Promise<void>;
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
        translations: (Database["public"]["Tables"]["translations"]["Row"] & {
          comments: {
            count: number;
          }[];
        })[];
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

  /**
   * Export translations for the given project and languages as JSON files.
   * Returns an object mapping language code to JSON string.
   */
  exportToJSON(
    projectId: string,
    languageIds: string[]
  ): Promise<Record<string, string>>;

  importFromJSON(
    projectId: string,
    languageId: string,
    jsonContent: string,
    importMode: "merge" | "replace",
    userId: string
  ): Promise<{
    success: boolean;
    stats: {
      totalKeys: number;
      newKeys: number;
      updatedTranslations: number;
      unchangedTranslations: number;
      errors: string[];
    };
  }>;
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
  ): Promise<Database["public"]["Tables"]["project_integrations"]["Row"]>;
  getProjectIntegration(
    projectId: string
  ): Promise<
    Database["public"]["Tables"]["project_integrations"]["Row"] | null
  >;
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

  exportTranslations(
    projectId: string,
    accessToken: string,
    repository: string,
    baseBranch: string,
    languageId?: string
  ): Promise<{ success: boolean; pullRequestUrl?: string }>;

  resolveTranslationConflicts(
    projectId: string,
    languageId: string,
    userId: string,
    resolutions: Array<{ key: string; resolvedValue: string }>
  ): Promise<{ success: boolean }>;

  resolveAllTranslationConflicts(
    projectId: string,
    userId: string,
    resolutions: Array<{
      languageId: string;
      resolutions: Array<{ key: string; resolvedValue: string }>;
    }>
  ): Promise<{ success: boolean }>;

  pullAndDetectConflicts(
    projectId: string,
    accessToken: string,
    repository: string,
    branch: string
  ): Promise<
    Record<
      string,
      Array<{
        linguaFlowKey: string | undefined;
        linguaFlowValue: string | undefined;
        githubKey: string | undefined;
        githubValue: string | undefined;
        position: number;
      }>
    >
  >;
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
  revertTranslationToVersion(
    translationId: string,
    versionId: string,
    userId: string
  ): Promise<{ success: boolean }>;
}

export interface ICommentsService {
  getComments(translationId: string): Promise<
    (Database["public"]["Tables"]["comments"]["Row"] & {
      user: {
        email: string | null;
        full_name: string | null;
        avatar_url: string | null;
      };
    })[]
  >;

  addComment(
    translationId: string,
    userId: string,
    content: string
  ): Promise<
    Database["public"]["Tables"]["comments"]["Row"] & {
      user: {
        email: string | null;
        full_name: string | null;
        avatar_url: string | null;
      };
    }
  >;

  deleteComment(commentId: string): Promise<void>;
}

export interface ISyncHistoryService {
  create(data: CreateSyncHistoryParamsDAL): Promise<void>;
  getByProjectId(
    projectId: string
  ): Promise<Database["public"]["Tables"]["sync_history"]["Row"][]>;
}

export interface IProjectMembersService {
  // Member management
  getProjectMembers(projectId: string): Promise<ProjectMemberWithProfile[]>;
  addProjectMember(
    projectId: string,
    userId: string,
    role: UserRole
  ): Promise<void>;
  updateMemberRole(
    projectId: string,
    userId: string,
    newRole: UserRole
  ): Promise<void>;
  removeMember(projectId: string, userId: string): Promise<void>;

  // Invitation management
  createInvitation(
    projectId: string,
    inviterId: string,
    inviteeEmail: string,
    role: UserRole,
    expiresAt: string
  ): Promise<string>;
  getProjectInvitations(projectId: string): Promise<ProjectInvitation[]>;
  acceptInvitation(token: string, userId: string): Promise<void>;
  rejectInvitation(token: string): Promise<void>;
  cancelInvitation(invitationId: string, projectId: string): Promise<void>;

  // Permission checks
  getUserProjectRole(
    projectId: string,
    userId: string
  ): Promise<UserRole | null>;

  getInvitationByToken(token: string): Promise<ProjectInvitation | null>;

  findByEmail(email: string): Promise<Profile | null>;

  createUserAndAcceptInvitation(
    email: string,
    password: string,
    token: string
  ): Promise<{ user: Profile }>; // session type can be refined
}

// AI Suggestions Service Interface
export interface TranslationSuggestion {
  suggestedText: string;
  confidenceScore: number;
  modelUsed: string;
  cached: boolean;
}

export interface IAISuggestionsService {
  getSuggestion(
    userId: string,
    projectId: string,
    translationKeyId: string,
    targetLanguageId: string
  ): Promise<TranslationSuggestion>;

  applySuggestion(
    projectId: string,
    translationKeyId: string,
    targetLanguageId: string,
    suggestedText: string,
    modelUsed: string,
    userId: string
  ): Promise<{ success: boolean }>;
}

export interface ITranslationMemoryService {
  storeTranslation(data: {
    projectId: string;
    sourceLanguageId: string;
    targetLanguageId: string;
    sourceText: string;
    targetText: string;
    translationKeyName?: string;
    context?: Json;
    qualityScore: number;
    createdBy: string;
  }): Promise<Database["public"]["Tables"]["translation_memory"]["Row"]>;

  findExactMatch(
    projectId: string,
    sourceText: string,
    targetLanguageId: string
  ): Promise<Database["public"]["Tables"]["translation_memory"]["Row"] | null>;

  findSimilarMatches(
    projectId: string,
    sourceText: string,
    targetLanguageId: string,
    threshold?: number,
    limit?: number
  ): Promise<Database["public"]["Tables"]["translation_memory"]["Row"][]>;

  getMemoryStats(projectId: string): Promise<{
    totalEntries: number;
    averageQuality: number;
    mostUsedEntries: Database["public"]["Tables"]["translation_memory"]["Row"][];
  }>;

  cleanupOldEntries(projectId: string, olderThanDays: number): Promise<number>;
}

export interface IMemoryMatchingService {
  calculateSimilarity(text1: string, text2: string): number;

  findBestMatches(
    sourceText: string,
    candidates: Database["public"]["Tables"]["translation_memory"]["Row"][],
    threshold?: number,
    limit?: number
  ): Database["public"]["Tables"]["translation_memory"]["Row"][];

  rankMatches(
    matches: Array<{
      entry: Database["public"]["Tables"]["translation_memory"]["Row"];
      similarity: number;
    }>
  ): Database["public"]["Tables"]["translation_memory"]["Row"][];
}

export interface IMemoryQualityService {
  calculateQualityScore(
    source: "human" | "ai_applied" | "ai_generated" | "human_corrected",
    usageCount?: number,
    ageInDays?: number
  ): number;

  shouldPromoteEntry(
    entry: Database["public"]["Tables"]["translation_memory"]["Row"]
  ): boolean;

  shouldDemoteEntry(
    entry: Database["public"]["Tables"]["translation_memory"]["Row"]
  ): boolean;
}
