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
}
