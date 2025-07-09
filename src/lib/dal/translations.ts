import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import {
  ITranslationsDAL,
  IPaginationDAL,
} from "../di/interfaces/dal.interfaces";
import { DEFAULT_PAGE_SIZE } from "./pagination";

type TranslationKey = Database["public"]["Tables"]["translation_keys"]["Row"];
type Translation = Database["public"]["Tables"]["translations"]["Row"] & {
  translation_keys: Pick<TranslationKey, "project_id">;
};

export type TranslationInsert = {
  key_id: string;
  language_id: string;
  content: string;
  translator_id: string;
  status: "approved";
};

interface TranslationKeyInsert {
  project_id: string;
  key: string;
  description?: string;
}

export class TranslationsDAL implements ITranslationsDAL {
  constructor(
    private supabase: SupabaseClient<Database>,
    private paginationDal: IPaginationDAL
  ) {}

  async upsertTranslationKeys(keys: TranslationKeyInsert[]) {
    const { data, error } = await this.supabase
      .from("translation_keys")
      .upsert(keys, {
        onConflict: "project_id,key",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      throw new Error(`Failed to upsert translation keys: ${error.message}`);
    }

    return data;
  }

  async getTranslationKeyByKey(projectId: string, key: string) {
    const { data, error } = await this.supabase
      .from("translation_keys")
      .select()
      .eq("project_id", projectId)
      .eq("key", key)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the error code for no rows returned
      throw new Error(`Failed to get translation key: ${error.message}`);
    }

    return data;
  }

  async getLanguageByCode(code: string) {
    const { data, error } = await this.supabase
      .from("languages")
      .select()
      .eq("code", code)
      .single();

    if (error) {
      throw new Error(`Failed to get language: ${error.message}`);
    }

    return data;
  }

  async getProjectTranslationKeys(
    projectIds: string[]
  ): Promise<TranslationKey[]> {
    const query = this.supabase
      .from("translation_keys")
      .select()
      .in("project_id", projectIds);

    return this.paginationDal.fetchAllPages<TranslationKey>(
      query,
      DEFAULT_PAGE_SIZE
    );
  }

  async getProjectTranslations(projectIds: string[]): Promise<Translation[]> {
    const query = this.supabase
      .from("translations")
      .select(
        `
        *,
        translation_keys (
          project_id
        )
      `
      )
      .in("translation_keys.project_id", projectIds);

    return this.paginationDal.fetchAllPages<Translation>(
      query,
      DEFAULT_PAGE_SIZE
    );
  }

  async getProjectTranslationsById(
    projectId: string,
    languageId: string,
    from: number,
    to: number
  ) {
    const { data, error, count } = await this.supabase
      .from("translations")
      .select("*, translation_keys!inner(project_id)", { count: "exact" })
      .eq("translation_keys.project_id", projectId)
      .eq("language_id", languageId)
      .range(from, to);

    if (error) {
      throw error;
    }

    return { data: data || [], count: count || 0 };
  }

  async getTranslationKeys(projectId: string, from: number, to: number) {
    const { data, error, count } = await this.supabase
      .from("translation_keys")
      .select("*", { count: "exact" })
      .eq("project_id", projectId)
      .range(from, to);

    if (error) {
      throw error;
    }

    return { data: data || [], count: count || 0 };
  }

  async createTranslationKey(
    translationKey: Omit<TranslationKey, "id" | "created_at" | "updated_at">
  ) {
    const { data, error } = await this.supabase
      .from("translation_keys")
      .insert(translationKey)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async upsertTranslations(
    translations: {
      key_id: string;
      language_id: string;
      content: string;
      translator_id: string;
      status: "approved";
    }[],
    userId: string,
    source: string
  ) {
    const { data, error } = await this.supabase
      .from("translations")
      .upsert(translations, {
        onConflict: "key_id,language_id",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      throw new Error(`Failed to upsert translations: ${error.message}`);
    }

    // Create version history entries in batch
    const versionEntries = data.map((translation) => ({
      translation_id: translation.id,
      content: translation.content,
      changed_by: userId,
      version_name: `Initial import from ${source}`,
      version_number: 1,
    }));

    await this.supabase.from("version_history").upsert(versionEntries, {
      onConflict: "translation_id,version_number",
      ignoreDuplicates: true,
    });

    return data;
  }
}
