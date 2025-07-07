import {
  GitHubService,
  Repository,
  Branch,
  TranslationFile,
} from "./github.service";
import { IIntegrationsDAL } from "../di/interfaces/dal.interfaces";
import { ITranslationsDAL } from "../di/interfaces/dal.interfaces";
import { IProjectsDAL } from "../di/interfaces/dal.interfaces";
import {
  IIntegrationsService,
  GitHubConfig,
} from "../di/interfaces/service.interfaces";
import { TranslationInsert } from "../dal/translations";
import { IntegrationConfig } from "../dal/integrations";

interface ParsedTranslation {
  key: string;
  value: string;
  language: string;
}

type NestedTranslations = {
  [key: string]: string | NestedTranslations;
};

export class IntegrationsService implements IIntegrationsService {
  private githubService: GitHubService | null = null;

  constructor(
    private integrationsDal: IIntegrationsDAL,
    private translationsDal: ITranslationsDAL,
    private projectsDal: IProjectsDAL
  ) {}

  async createGitHubIntegration(
    projectId: string,
    config: GitHubConfig
  ): Promise<void> {
    await this.integrationsDal.createGitHubIntegration(projectId, config);
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
  ) {
    try {
      // Initialize GitHub service with access token
      this.githubService = new GitHubService(accessToken);
      const [owner, repo] = repository.split("/");

      // First collect all translations from all files
      const allTranslations: {
        key: string;
        value: string;
        languageId: string;
      }[] = [];

      // Process each translation file to collect translations
      for (const file of files) {
        const content = await this.githubService.getFileContent(
          `${owner}/${repo}`,
          file.path,
          branch
        );

        if (!content) {
          continue;
        }

        const fileType = file.path.split(".").pop() || "unknown";
        const languageCode = file.name.split(".")[0];

        if (!languageCode) {
          continue;
        }

        // Get or create language in the project
        const language = await this.translationsDal.getLanguageByCode(
          languageCode
        );

        await this.projectsDal.ensureProjectLanguage(projectId, language.id);

        // Parse translations from file
        const parsedTranslations = this.parseTranslationFile(
          content,
          file.path,
          fileType
        );

        // Add to collection with language ID
        allTranslations.push(
          ...parsedTranslations.map((t) => ({
            key: t.key,
            value: t.value,
            languageId: language.id,
          }))
        );
      }

      // Process translations in batches of 500
      const BATCH_SIZE = 500;
      const uniqueKeys = [...new Set(allTranslations.map((t) => t.key))];

      // Process translation keys in batches
      for (let i = 0; i < uniqueKeys.length; i += BATCH_SIZE) {
        const keysBatch = uniqueKeys.slice(i, i + BATCH_SIZE);

        const translationKeysBatch = keysBatch.map((key) => ({
          project_id: projectId,
          key: key,
        }));

        // Upsert batch of translation keys
        const insertedKeys = await this.translationsDal.upsertTranslationKeys(
          translationKeysBatch
        );

        // Prepare translations for this batch of keys
        const translationValues = insertedKeys
          .map((key) => {
            const translations = allTranslations.filter(
              (t) => t.key === key.key
            );

            return translations.map((translation) => ({
              key_id: key.id,
              language_id: translation.languageId,
              content: translation.value,
              translator_id: userId,
              status: "approved" as const,
            }));
          })
          .flat()
          .filter((t): t is TranslationInsert => t !== null);

        // Process translations in sub-batches
        for (let j = 0; j < translationValues.length; j += BATCH_SIZE) {
          const translationsBatch = translationValues.slice(j, j + BATCH_SIZE);

          await this.translationsDal.upsertTranslations(
            translationsBatch,
            userId,
            `github:${owner}/${repo}`
          );
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

      return { success: true };
    } catch (error) {
      console.error("Failed to import translations:", error);

      throw new Error(
        `Failed to import translations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
