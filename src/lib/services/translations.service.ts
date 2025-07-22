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

  async getLatestVersionNumber(translationId: string) {
    return await this.translationsDAL.getLatestVersionNumber(translationId);
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
}
