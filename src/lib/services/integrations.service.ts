import { GitHubService, TranslationFile } from "./github.service";
import {
  IIntegrationsDAL,
  ISyncHistoryDAL,
} from "../di/interfaces/dal.interfaces";
import { ITranslationsDAL } from "../di/interfaces/dal.interfaces";
import { IProjectsDAL } from "../di/interfaces/dal.interfaces";
import {
  IIntegrationsService,
  GitHubConfig,
} from "../di/interfaces/service.interfaces";
import { TranslationInsert } from "../di/interfaces/dal.interfaces";
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
    private projectsDal: IProjectsDAL,
    private syncHistoryDal: ISyncHistoryDAL
  ) {}

  private generateTranslationFiles(
    translations: { key: string; content: string; language: string }[],
    languages: { id: string; code: string }[]
  ): { [key: string]: string } {
    const filesByLanguage: { [key: string]: { [key: string]: string } } = {};

    languages.forEach((language) => {
      filesByLanguage[language.code] = {};
    });

    // Group translations by language
    translations.forEach(({ key, content, language }) => {
      filesByLanguage[language][key] = content;
    });

    // Convert each language group to JSON string
    const files: { [key: string]: string } = {};

    for (const [language, translations] of Object.entries(filesByLanguage)) {
      files[`${language}.json`] = JSON.stringify(translations, null, 2);
    }

    return files;
  }

  async exportTranslations(
    projectId: string,
    accessToken: string,
    repository: string,
    baseBranch: string,
    languageId?: string
  ): Promise<{ success: boolean; pullRequestUrl?: string }> {
    try {
      // Initialize GitHub service
      this.githubService = new GitHubService(accessToken);

      // Get project integration to get file path configuration
      const integration = await this.integrationsDal.getProjectIntegration(
        projectId
      );

      if (!integration) {
        throw new Error("No GitHub integration found for this project");
      }

      // Get translations for export
      const translations =
        await this.integrationsDal.getProjectTranslationsForExport(
          projectId,
          languageId
        );

      if (!translations.length) {
        throw new Error("No approved translations found for export");
      }

      // Get project languages
      const languages = await this.integrationsDal.getProjectLanguagesForExport(
        projectId
      );

      if (!languages.length) {
        throw new Error("No languages found for the project");
      }

      // Generate translation files
      const files = this.generateTranslationFiles(translations, languages);

      // Create new branch for the export
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const newBranch = `translations/export-${timestamp}`;
      await this.githubService.createBranch(repository, baseBranch, newBranch);

      // Get existing translation files to detect deleted languages
      const translationPath =
        typeof integration.config === "object" && integration.config !== null
          ? (integration.config as { translationPath?: string }).translationPath
          : undefined;

      const filePattern =
        typeof integration.config === "object" && integration.config !== null
          ? (integration.config as { filePattern?: string }).filePattern
          : undefined;

      // Construct the full pattern with the translation path if provided
      const fullPattern = translationPath
        ? `${translationPath}/${filePattern || "*.{json,yaml,yml,po}"}`
        : filePattern;

      const existingFiles = await this.githubService.findTranslationFiles(
        repository,
        baseBranch,
        fullPattern
      );

      // Find languages that were deleted (files that exist but language no longer in project)
      const currentLanguageCodes = new Set(languages.map((l) => l.code));

      const deletedFiles = existingFiles.filter((file) => {
        const langCode = file.name.split(".")[0];
        return !currentLanguageCodes.has(langCode);
      });

      // Delete files for removed languages
      for (const file of deletedFiles) {
        await this.githubService.deleteFile(
          repository,
          newBranch,
          file.path,
          `Remove translations for deleted language: ${file.name}`
        );
      }

      // Upload translation files
      for (const [filename, content] of Object.entries(files)) {
        const filePath = translationPath
          ? `${translationPath}/${filename}`
          : filename;

        await this.githubService.createOrUpdateFile(
          repository,
          newBranch,
          filePath,
          content,
          `Update translations for ${filename}`
        );
      }

      // Create pull request
      try {
        const { url } = await this.githubService.createPullRequest(
          repository,
          baseBranch,
          newBranch,
          `Update translations (${new Date().toISOString().split("T")[0]})`,
          "This PR contains updated translations from LinguaFlow."
        );

        // Update integration status
        await this.updateIntegrationStatus(
          integration.id,
          true,
          new Date().toISOString()
        );

        // Create sync history record
        await this.integrationsDal.createSyncHistory({
          project_id: projectId,
          integration_id: integration.id,
          status: "success",
          details: {
            repository,
            branch: newBranch,
            pullRequestUrl: url,
            filesCount: Object.keys(files).length,
            translationsCount: translations.length,
          },
        });

        return { success: true, pullRequestUrl: url };
      } catch (error) {
        // If there are no changes, clean up the branch and return success
        if (
          error instanceof Error &&
          (error.message.includes("No changes detected") ||
            error.message.includes("No significant changes"))
        ) {
          // Clean up the temporary branch
          if (await this.githubService.hasBranch(repository, newBranch)) {
            await this.githubService.deleteBranch(repository, newBranch);
          }

          // Create sync history record for no-changes case
          await this.integrationsDal.createSyncHistory({
            project_id: projectId,
            integration_id: integration.id,
            status: "success",
            details: {
              repository,
              branch: baseBranch,
              message: "No changes detected in translations",
            },
          });

          return { success: true };
        }
        throw error;
      }
    } catch (error) {
      console.error("Failed to export translations:", error);

      // If we have an integration, record the failure
      try {
        const integration = await this.integrationsDal.getProjectIntegration(
          projectId
        );

        if (integration) {
          await this.integrationsDal.createSyncHistory({
            project_id: projectId,
            integration_id: integration.id,
            status: "failed",
            details: {
              repository,
              branch: baseBranch,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      } catch (syncError) {
        console.error("Failed to record sync history:", syncError);
      }

      throw new Error(
        `Failed to export translations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async createGitHubIntegration(projectId: string, config: GitHubConfig) {
    return await this.integrationsDal.createGitHubIntegration(
      projectId,
      config
    );
  }

  async getProjectIntegration(projectId: string) {
    return await this.integrationsDal.getProjectIntegration(projectId);
  }

  async listRepositories(accessToken: string) {
    const githubService = new GitHubService(accessToken);
    return await githubService.listRepositories();
  }

  async listBranches(accessToken: string, owner: string, repo: string) {
    const githubService = new GitHubService(accessToken);
    return await githubService.listBranches(`${owner}/${repo}`);
  }

  async importTranslations(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string,
    files: TranslationFile[]
  ) {
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
    return await this.integrationsDal.updateIntegrationConfig(
      integrationId,
      config
    );
  }

  async updateIntegrationStatus(
    integrationId: string,
    isConnected: boolean,
    lastSyncedAt?: string
  ) {
    return await this.integrationsDal.updateIntegrationStatus(
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
  ) {
    const translations: (ParsedTranslation & { entry_order: number })[] = [];
    let order = 0;

    try {
      if (fileType === "json") {
        const data = JSON.parse(content) as NestedTranslations;
        // Assuming the file name contains the language code (e.g., en.json, fr.json)
        const language = filePath.split("/").pop()?.split(".")[0] || "unknown";

        // Flatten nested JSON structure
        const flattenObject = (obj: NestedTranslations, prefix = ""): void => {
          // Get keys in their original order from the file
          const keys = Object.keys(obj);

          for (const key of keys) {
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
                entry_order: order++,
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
        entry_order: number;
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
            entry_order: t.entry_order,
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
              entry_order: translation.entry_order,
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

  /**
   * Apply user resolutions for translation conflicts.
   * @param projectId
   * @param languageId
   * @param resolutions: Array<{ key, resolvedValue, userId }>
   */
  async resolveTranslationConflicts(
    projectId: string,
    languageId: string,
    userId: string,
    resolutions: Array<{ key: string; resolvedValue: string }>
  ) {
    return await this.resolveAllTranslationConflicts(projectId, userId, [
      { languageId, resolutions },
    ]);
  }

  async resolveAllTranslationConflicts(
    projectId: string,
    userId: string,
    resolutions: Array<{
      languageId: string;
      resolutions: Array<{ key: string; resolvedValue: string }>;
    }>
  ) {
    // Get translation keys for the project
    const translationKeys =
      await this.translationsDal.getProjectTranslationKeys([projectId]);

    const keyMap = Object.fromEntries(
      translationKeys.map((k) => [k.key, k.id])
    );

    // Process all language resolutions
    for (const { languageId, resolutions: langResolutions } of resolutions) {
      for (const { key, resolvedValue } of langResolutions) {
        let keyId = keyMap[key];

        // If key doesn't exist, create it
        if (!keyId) {
          const newKey = await this.translationsDal.createTranslationKey({
            project_id: projectId,
            key: key,
            description: null,
          });

          keyId = newKey.id;

          // Update the keyMap for subsequent iterations
          keyMap[key] = keyId;
        }

        // Find the translation for this key/language
        const translations = await this.translationsDal.getProjectTranslations([
          projectId,
        ]);

        const translation = translations.find(
          (t) => t.key_id === keyId && t.language_id === languageId
        );

        if (translation) {
          await this.translationsDal.updateTranslation(
            translation.id,
            resolvedValue,
            userId
          );
        } else {
          // If translation does not exist, create it
          await this.translationsDal.createTranslation(
            keyId,
            languageId,
            resolvedValue,
            userId
          );
        }
      }
    }

    return { success: true };
  }

  /**
   * Pull translation files from GitHub, parse, and detect conflicts.
   */
  async pullAndDetectConflicts(
    projectId: string,
    accessToken: string,
    repository: string,
    branch: string
  ) {
    // Fetch integration config
    const integration = await this.integrationsDal.getProjectIntegration(
      projectId
    );

    if (!integration) {
      throw new Error("No integration found for this project");
    }

    const translationPath =
      typeof integration.config === "object" && integration.config !== null
        ? (integration.config as { translationPath?: string }).translationPath
        : undefined;

    const filePattern =
      typeof integration.config === "object" && integration.config !== null
        ? (integration.config as { filePattern?: string }).filePattern
        : undefined;

    // Get all project languages
    const languages = await this.integrationsDal.getProjectLanguagesForExport(
      projectId
    );

    const githubService = new GitHubService(accessToken);

    const fullPattern = translationPath
      ? `${translationPath}/${filePattern || "*.{json,yaml,yml,po}"}`
      : filePattern;

    const files = await githubService.findTranslationFiles(
      repository,
      branch,
      fullPattern
    );

    // Map: languageCode -> github ordered array
    const githubByLang: Record<
      string,
      Array<{ key: string; value: string }>
    > = {};

    for (const lang of languages) {
      githubByLang[lang.code] = [];
    }

    for (const file of files) {
      const langCode = file.name.split(".")[0];

      if (!githubByLang[langCode]) {
        continue;
      }

      const content = await githubService.getFileContent(
        repository,
        file.path,
        branch
      );

      if (!content) {
        continue;
      }

      try {
        const data = JSON.parse(content);

        // Preserve order as in file
        for (const key of Object.keys(data)) {
          const value = data[key];

          if (typeof value === "string") {
            githubByLang[langCode].push({ key, value });
          }
        }
      } catch (error) {
        console.error("Error parsing translation file:", error);
      }
    }

    // Run robust conflict detection for each language
    const result: Record<
      string,
      Array<{
        linguaFlowKey: string | undefined;
        linguaFlowValue: string | undefined;
        githubKey: string | undefined;
        githubValue: string | undefined;
        position: number;
      }>
    > = {};

    for (const lang of languages) {
      // 1. Get LinguaFlow translations as ordered array
      const linguaFlowArr = (
        await this.integrationsDal.getProjectTranslationsForExport(
          projectId,
          lang.id
        )
      ).map((t) => ({ key: t.key, value: t.content }));

      // 2. Get GitHub translations as ordered array
      const githubArr = githubByLang[lang.code];

      // 3. Create maps for key-based comparison
      const linguaFlowMap = Object.fromEntries(
        linguaFlowArr.map((t) => [t.key, t.value])
      );

      const githubMap = Object.fromEntries(
        githubArr.map((t) => [t.key, t.value])
      );

      // 4. Get all unique keys
      const allKeys = new Set([
        ...Object.keys(linguaFlowMap),
        ...Object.keys(githubMap),
      ]);

      const conflicts: Array<{
        linguaFlowKey: string | undefined;
        linguaFlowValue: string | undefined;
        githubKey: string | undefined;
        githubValue: string | undefined;
        position: number;
      }> = [];

      let position = 0;

      for (const key of allKeys) {
        const linguaFlowValue = linguaFlowMap[key];
        const githubValue = githubMap[key];

        // Check if there's a conflict (different values or missing in one side)
        if (linguaFlowValue !== githubValue) {
          conflicts.push({
            linguaFlowKey: linguaFlowValue !== undefined ? key : undefined,
            linguaFlowValue,
            githubKey: githubValue !== undefined ? key : undefined,
            githubValue,
            position: position++,
          });
        }
      }

      result[lang.code] = conflicts;
    }

    return result;
  }
}
