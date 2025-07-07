import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { DIContainer } from "./container";

// DAL imports
import { ProjectsDAL } from "../dal/projects";
import { ActivitiesDAL } from "../dal/activities";
import { TranslationsDAL } from "../dal/translations";
import { IntegrationsDAL } from "../dal/integrations";
import { LanguagesDAL } from "../dal/languages";

// Service imports
import { ProjectsService } from "../services/projects.service";
import { LanguagesService } from "../services/languages.service";
import { IntegrationsService } from "../services/integrations.service";

// Interface imports
import {
  IProjectsDAL,
  IActivitiesDAL,
  ITranslationsDAL,
  IIntegrationsDAL,
  ILanguagesDAL,
  IPaginationDAL,
  IVersionHistoryDAL,
  IGitHubTokensDAL,
} from "./interfaces/dal.interfaces";
import {
  IProjectsService,
  ILanguagesService,
  IIntegrationsService,
  IGitHubTokensService,
} from "./interfaces/service.interfaces";
import { PaginationDAL } from "../dal/pagination";
import { VersionHistoryDAL } from "../dal/version-history";
import { GitHubTokensService } from "../services/github-tokens.service";
import { GitHubTokensDAL } from "../dal/github-tokens";

// Token constants for dependency injection
export const DI_TOKENS = {
  // DAL tokens
  PROJECTS_DAL: "PROJECTS_DAL",
  ACTIVITIES_DAL: "ACTIVITIES_DAL",
  TRANSLATIONS_DAL: "TRANSLATIONS_DAL",
  INTEGRATIONS_DAL: "INTEGRATIONS_DAL",
  LANGUAGES_DAL: "LANGUAGES_DAL",
  VERSION_HISTORY_DAL: "VERSION_HISTORY_DAL",
  PAGINATION_DAL: "PAGINATION_DAL",
  GITHUB_TOKENS_DAL: "GITHUB_TOKENS_DAL",
  // Service tokens
  PROJECTS_SERVICE: "PROJECTS_SERVICE",
  LANGUAGES_SERVICE: "LANGUAGES_SERVICE",
  INTEGRATIONS_SERVICE: "INTEGRATIONS_SERVICE",
  GITHUB_TOKENS_SERVICE: "GITHUB_TOKENS_SERVICE",

  // Core dependencies
  SUPABASE: "SUPABASE",
};

/**
 * Registers all services and DALs with the DI container
 */
export function registerServices(
  container: DIContainer,
  supabase: SupabaseClient<Database>
): void {
  // Register Supabase client
  container.register(DI_TOKENS.SUPABASE, () => supabase);

  // Register DALs
  container.register<IProjectsDAL>(
    DI_TOKENS.PROJECTS_DAL,
    (c) =>
      new ProjectsDAL(
        c.resolve(DI_TOKENS.SUPABASE),
        c.resolve(DI_TOKENS.TRANSLATIONS_DAL)
      )
  );

  container.register<IActivitiesDAL>(
    DI_TOKENS.ACTIVITIES_DAL,
    (c) => new ActivitiesDAL(c.resolve(DI_TOKENS.SUPABASE))
  );

  container.register<ITranslationsDAL>(
    DI_TOKENS.TRANSLATIONS_DAL,
    (c) =>
      new TranslationsDAL(
        c.resolve(DI_TOKENS.SUPABASE),
        c.resolve(DI_TOKENS.PAGINATION_DAL)
      )
  );

  container.register<IIntegrationsDAL>(
    DI_TOKENS.INTEGRATIONS_DAL,
    (c) => new IntegrationsDAL(c.resolve(DI_TOKENS.SUPABASE))
  );

  container.register<ILanguagesDAL>(
    DI_TOKENS.LANGUAGES_DAL,
    (c) => new LanguagesDAL(c.resolve(DI_TOKENS.SUPABASE))
  );

  container.register<IVersionHistoryDAL>(
    DI_TOKENS.VERSION_HISTORY_DAL,
    (c) =>
      new VersionHistoryDAL(
        c.resolve(DI_TOKENS.SUPABASE),
        c.resolve(DI_TOKENS.PAGINATION_DAL)
      )
  );

  container.register<IPaginationDAL>(
    DI_TOKENS.PAGINATION_DAL,
    (c) => new PaginationDAL(c.resolve(DI_TOKENS.SUPABASE))
  );

  container.register<IGitHubTokensDAL>(
    DI_TOKENS.GITHUB_TOKENS_DAL,
    (c) => new GitHubTokensDAL(c.resolve(DI_TOKENS.SUPABASE))
  );

  // Register services
  container.register<ILanguagesService>(
    DI_TOKENS.LANGUAGES_SERVICE,
    (c) => new LanguagesService(c.resolve(DI_TOKENS.LANGUAGES_DAL))
  );

  container.register<IIntegrationsService>(
    DI_TOKENS.INTEGRATIONS_SERVICE,
    (c) =>
      new IntegrationsService(
        c.resolve(DI_TOKENS.INTEGRATIONS_DAL),
        c.resolve(DI_TOKENS.TRANSLATIONS_DAL),
        c.resolve(DI_TOKENS.PROJECTS_DAL)
      )
  );

  container.register<IProjectsService>(
    DI_TOKENS.PROJECTS_SERVICE,
    (c) =>
      new ProjectsService(
        c.resolve(DI_TOKENS.PROJECTS_DAL),
        c.resolve(DI_TOKENS.ACTIVITIES_DAL),
        c.resolve(DI_TOKENS.TRANSLATIONS_DAL),
        c.resolve(DI_TOKENS.INTEGRATIONS_SERVICE)
      )
  );

  container.register<IGitHubTokensService>(
    DI_TOKENS.GITHUB_TOKENS_SERVICE,
    (c) => new GitHubTokensService(c.resolve(DI_TOKENS.GITHUB_TOKENS_DAL))
  );
}
