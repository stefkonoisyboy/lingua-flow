import {
  IIntegrationsDAL,
  ITranslationsDAL,
} from "../di/interfaces/dal.interfaces";
import { ITranslationsService } from "../di/interfaces/service.interfaces";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

export class TranslationsService implements ITranslationsService {
  constructor(
    private readonly translationsDAL: ITranslationsDAL,
    private readonly integrationsDAL: IIntegrationsDAL
  ) {}

  async getTranslationKeys(
    projectId: string,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    languageId?: string,
    defaultLanguageId?: string
  ) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count } = await this.translationsDAL.getTranslationKeys(
      projectId,
      from,
      to,
      languageId,
      defaultLanguageId
    );

    return {
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  async createTranslationKeyWithTranslations(
    projectId: string,
    key: string,
    translations: {
      languageId: string;
      content: string;
      userId: string;
    }[],
    description?: string
  ) {
    // First check if the key already exists
    const existingKey = await this.translationsDAL.getTranslationKeyByKey(
      projectId,
      key
    );

    if (existingKey) {
      throw new Error(
        `Translation key "${key}" already exists in this project`
      );
    }

    // Create the key and translations
    return await this.translationsDAL.createTranslationKeyWithTranslations(
      projectId,
      key,
      translations,
      description
    );
  }

  async updateTranslationKey(keyId: string, newKey: string) {
    return await this.translationsDAL.updateTranslationKey(keyId, newKey);
  }

  async updateTranslation(
    translationId: string,
    content: string,
    userId: string
  ) {
    return await this.translationsDAL.updateTranslation(
      translationId,
      content,
      userId
    );
  }

  async createTranslation(
    keyId: string,
    languageId: string,
    content: string,
    userId: string
  ) {
    return await this.translationsDAL.createTranslation(
      keyId,
      languageId,
      content,
      userId
    );
  }

  /**
   * Export translations for the given project and languages as JSON files.
   * Returns an object mapping language code to JSON string.
   */
  async exportToJSON(projectId: string, languageIds: string[]) {
    // 1. Fetch all project languages (id/code)
    const languages = await this.integrationsDAL.getProjectLanguagesForExport(
      projectId
    );

    const langMap = Object.fromEntries(languages.map((l) => [l.id, l.code]));

    // 2. For each language, fetch translations and build JSON
    const result: Record<string, string> = {};

    for (const languageId of languageIds) {
      const code = langMap[languageId];

      if (!code) {
        continue;
      }

      const translations =
        await this.integrationsDAL.getProjectTranslationsForExport(
          projectId,
          languageId
        );
      // Build flat key-value object
      const obj: Record<string, string> = {};

      for (const t of translations) {
        obj[t.key] = t.content;
      }

      result[code] = JSON.stringify(obj, null, 2);
    }

    return result;
  }

  /**
   * Import translations from a JSON file for a specific language.
   * Supports 'merge' (default) and 'replace' modes.
   */
  async importFromJSON(
    projectId: string,
    languageId: string,
    jsonContent: string,
    importMode: "merge" | "replace",
    userId: string
  ) {
    // Parse and flatten JSON
    const parsed: Record<string, string> = {};

    try {
      const data = JSON.parse(jsonContent);

      // Flatten nested structure
      const flatten = (obj: Record<string, unknown>, prefix = ""): void => {
        for (const key of Object.keys(obj)) {
          const value = obj[key];
          const fullKey = prefix ? `${prefix}.${key}` : key;

          if (typeof value === "object" && value !== null) {
            flatten(value as Record<string, unknown>, fullKey);
          } else if (typeof value === "string") {
            parsed[fullKey] = value;
          }
        }
      };

      flatten(data);
    } catch (err) {
      console.error(err);
      throw new Error("Invalid JSON file.");
    }

    const keys = Object.keys(parsed);

    if (!keys.length) {
      throw new Error("No translations found in file.");
    }

    // If replace mode, delete all existing translations for this language
    if (importMode === "replace") {
      await this.translationsDAL.deleteTranslationsForLanguage(
        projectId,
        languageId
      );
    }

    // Upsert translation keys
    const translationKeys = keys.map((key) => ({ project_id: projectId, key }));

    const insertedKeys = await this.translationsDAL.upsertTranslationKeys(
      translationKeys
    );

    const keyIdMap = Object.fromEntries(insertedKeys.map((k) => [k.key, k.id]));

    // Prepare translations for upsert
    let startOrder = 0;

    if (importMode === "merge") {
      startOrder =
        (await this.translationsDAL.getMaxEntryOrder(projectId, languageId)) +
        1;
    }
    // For replace mode, startOrder remains 0
    const translations = keys.map((key, idx) => ({
      key_id: keyIdMap[key],
      language_id: languageId,
      content: parsed[key],
      translator_id: userId,
      status: "approved" as const,
      entry_order: startOrder + idx,
    }));

    // Efficient version history for updates in merge mode
    // Map: key = key_id|language_id, value = { id, content }
    let existingMap: Map<string, { id: string; content: string }> = new Map();

    if (importMode === "merge") {
      const pairs = translations.map((t) => ({
        key_id: t.key_id,
        language_id: t.language_id,
      }));

      const existing =
        await this.translationsDAL.getTranslationsByKeyAndLanguage(pairs);

      existingMap = new Map(
        existing.map((t) => [
          `${t.key_id}|${t.language_id}`,
          { id: t.id, content: t.content },
        ])
      );
    }

    // Upsert translations
    const upserted = await this.translationsDAL.upsertTranslations(
      translations,
      userId,
      "import:json"
    );

    // After upsert, batch-create version history for updated translations (merge mode only)
    if (importMode === "merge" && upserted.length > 0) {
      // Only create version history for translations where content actually changed
      const updated = upserted.filter((t) => {
        const prev = existingMap.get(`${t.key_id}|${t.language_id}`);
        // Only if previous exists and content changed
        return prev && prev.content !== t.content;
      });

      if (updated.length > 0) {
        const updatedIds = updated.map((t) => t.id);

        const versionNumbers =
          await this.translationsDAL.getLatestVersionNumbers(updatedIds);

        const versionMap = new Map(
          versionNumbers.map((v) => [v.translation_id, v.version_number])
        );

        const versionEntries = updated.map((t) => {
          const prev = existingMap.get(`${t.key_id}|${t.language_id}`);

          return {
            translation_id: t.id,
            content: prev?.content ?? "",
            changed_by: userId,
            version_name: "Import update",
            version_number: (versionMap.get(t.id) ?? 0) + 1,
          };
        });

        await this.translationsDAL.batchInsertVersionHistory(versionEntries);
      }
    }

    // Accurate stats
    let added = 0,
      updated = 0,
      skipped = 0;

    for (const t of upserted) {
      const prev = existingMap.get(`${t.key_id}|${t.language_id}`);

      if (!prev) {
        added++;
      } else if (prev.content !== t.content) {
        updated++;
      } else {
        skipped++;
      }
    }

    return {
      success: true,
      stats: {
        totalKeys: keys.length,
        newKeys: added,
        updatedTranslations: updated,
        unchangedTranslations: skipped,
        errors: [],
      },
    };
  }
}
