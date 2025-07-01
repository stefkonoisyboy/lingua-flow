import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import {
  GitHubService,
  Repository,
  Branch,
  TranslationFile,
} from "./github.service";
import { IntegrationsDAL, IntegrationConfig } from "../dal/integrations";
import { TranslationsDAL } from "../dal/translations";

interface ParsedTranslation {
  key: string;
  value: string;
  language: string;
}

type NestedTranslations = {
  [key: string]: string | NestedTranslations;
};

export class IntegrationsService {
  private integrationsDal: IntegrationsDAL;
  private translationsDal: TranslationsDAL;

  constructor(supabase: SupabaseClient<Database>) {
    this.integrationsDal = new IntegrationsDAL(supabase);
    this.translationsDal = new TranslationsDAL(supabase);
  }

  async createGitHubIntegration(projectId: string, config: IntegrationConfig) {
    return this.integrationsDal.createIntegration(projectId, "github", config);
  }

  async getProjectIntegration(projectId: string) {
    return this.integrationsDal.getProjectIntegration(projectId);
  }

  async listRepositories(accessToken: string): Promise<Repository[]> {
    const githubService = new GitHubService(accessToken);
    return githubService.listRepositories();
  }

  async listBranches(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<Branch[]> {
    const githubService = new GitHubService(accessToken);
    return githubService.listBranches(`${owner}/${repo}`);
  }

  async importTranslations(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string,
    files: TranslationFile[]
  ): Promise<{ [key: string]: string }> {
    const githubService = new GitHubService(accessToken);
    const translations: { [key: string]: string } = {};

    for (const file of files) {
      const content = await githubService.getFileContent(
        `${owner}/${repo}`,
        file.path,
        branch
      );
      if (content) {
        translations[file.path] = content;
      }
    }

    return translations;
  }

  async updateIntegrationConfig(
    integrationId: string,
    config: Partial<IntegrationConfig>
  ) {
    return this.integrationsDal.updateIntegrationConfig(integrationId, config);
  }

  async updateIntegrationStatus(
    integrationId: string,
    isConnected: boolean,
    lastSyncedAt?: string
  ) {
    return this.integrationsDal.updateIntegrationStatus(
      integrationId,
      isConnected,
      lastSyncedAt
    );
  }

  async deleteIntegration(integrationId: string) {
    await this.integrationsDal.deleteIntegration(integrationId);
  }

  private parseTranslationFile(
    content: string,
    filePath: string,
    fileType: string
  ): ParsedTranslation[] {
    console.log("Parsing translation file:", { filePath, fileType });
    const translations: ParsedTranslation[] = [];

    try {
      if (fileType === "json") {
        const data = JSON.parse(content) as NestedTranslations;
        // Assuming the file name contains the language code (e.g., en.json, fr.json)
        const language = filePath.split("/").pop()?.split(".")[0] || "unknown";

        // Flatten nested JSON structure
        const flattenObject = (obj: NestedTranslations, prefix = ""): void => {
          for (const key in obj) {
            const value = obj[key];

            if (typeof value === "object" && value !== null) {
              flattenObject(
                value as NestedTranslations,
                prefix ? `${prefix}.${key}` : key
              );
            } else if (typeof value === "string") {
              translations.push({
                key: prefix ? `${prefix}.${key}` : key,
                value: value,
                language,
              });
            }
          }
        };

        flattenObject(data);
      } else if (fileType === "yaml" || fileType === "yml") {
        // For YAML implementation, you'll need to add yaml parsing library
        console.log("YAML parsing will be implemented");
      } else if (fileType === "po") {
        // For PO file implementation, you'll need to add gettext parsing library
        console.log("PO file parsing will be implemented");
      }
    } catch (error) {
      console.error("Error parsing translation file:", error);
    }

    return translations;
  }

  async importProjectTranslations(
    projectId: string,
    accessToken: string,
    repository: string,
    branch: string,
    files: TranslationFile[],
    userId: string
  ): Promise<void> {
    const githubService = new GitHubService(accessToken);
    const [owner, repo] = repository.split("/");

    for (const file of files) {
      const content = await githubService.getFileContent(
        `${owner}/${repo}`,
        file.path,
        branch
      );

      if (content) {
        const fileType = file.path.split(".").pop() || "unknown";

        const parsedTranslations = this.parseTranslationFile(
          content,
          file.path,
          fileType
        );

        // Store each translation
        for (const translation of parsedTranslations) {
          try {
            // Get or create the language
            const language = await this.translationsDal.getLanguageByCode(
              translation.language
            );
            if (!language) {
              console.warn(
                `Language ${translation.language} not found, skipping translation`
              );
              continue;
            }

            // Get or create the translation key
            let translationKey =
              await this.translationsDal.getTranslationKeyByKey(
                projectId,
                translation.key
              );

            if (!translationKey) {
              translationKey = await this.translationsDal.createTranslationKey(
                projectId,
                translation.key,
                translation.value // Using the value as source content
              );
            }

            // Create the translation with source information
            await this.translationsDal.createTranslation(
              translationKey.id,
              language.id,
              translation.value,
              userId,
              `GitHub: ${repository}/${file.path} (${branch})`
            );
          } catch (error) {
            console.error("Error storing translation:", error);
            // Continue with other translations even if one fails
          }
        }

        // Update integration status
        const integration = await this.integrationsDal.getProjectIntegration(
          projectId
        );
        if (integration) {
          await this.updateIntegrationStatus(
            integration.id,
            true,
            new Date().toISOString()
          );
        }
      }
    }
  }
}
