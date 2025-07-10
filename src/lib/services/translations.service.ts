import { ITranslationsDAL } from "../di/interfaces/dal.interfaces";
import {
  ITranslationsService,
  PaginatedResponse,
} from "../di/interfaces/service.interfaces";
import { Database } from "../types/database.types";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

export class TranslationsService implements ITranslationsService {
  constructor(private readonly translationsDAL: ITranslationsDAL) {}

  async getTranslationKeys(
    projectId: string,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    languageId?: string,
    defaultLanguageId?: string
  ): Promise<
    PaginatedResponse<
      Database["public"]["Tables"]["translation_keys"]["Row"] & {
        translations: Database["public"]["Tables"]["translations"]["Row"][];
      }
    >
  > {
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
    return this.translationsDAL.createTranslationKeyWithTranslations(
      projectId,
      key,
      translations,
      description
    );
  }

  async getLatestVersionNumber(translationId: string): Promise<number> {
    return this.translationsDAL.getLatestVersionNumber(translationId);
  }

  async updateTranslationKey(keyId: string, newKey: string) {
    return this.translationsDAL.updateTranslationKey(keyId, newKey);
  }

  async updateTranslation(
    translationId: string,
    content: string,
    userId: string
  ) {
    return this.translationsDAL.updateTranslation(
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
    return this.translationsDAL.createTranslation(
      keyId,
      languageId,
      content,
      userId
    );
  }
}
