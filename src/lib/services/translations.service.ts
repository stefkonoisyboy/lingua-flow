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

  async getProjectTranslations(
    projectId: string,
    languageId: string,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE
  ): Promise<
    PaginatedResponse<Database["public"]["Tables"]["translations"]["Row"]>
  > {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count } =
      await this.translationsDAL.getProjectTranslationsById(
        projectId,
        languageId,
        from,
        to
      );

    return {
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  async getTranslationKeys(
    projectId: string,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE
  ): Promise<
    PaginatedResponse<Database["public"]["Tables"]["translation_keys"]["Row"]>
  > {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count } = await this.translationsDAL.getTranslationKeys(
      projectId,
      from,
      to
    );

    return {
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > page * pageSize,
    };
  }
}
