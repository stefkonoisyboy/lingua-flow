import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import {
  ITranslationsDAL,
  IPaginationDAL,
  TranslationKey,
  Translation,
} from "../di/interfaces/dal.interfaces";
import { DEFAULT_PAGE_SIZE } from "./pagination";

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

  async getTranslationKeys(
    projectId: string,
    from: number,
    to: number,
    languageId?: string,
    defaultLanguageId?: string
  ) {
    if (!languageId) {
      return { data: [], count: 0 };
    }

    const { data, error, count } = await this.supabase
      .from("translation_keys")
      .select(
        `
        *,
        translations!translations_key_id_fkey(
          id,
          key_id,
          content,
          language_id,
          status,
          translator_id,
          reviewer_id,
          created_at,
          updated_at
        )
      `,
        { count: "exact" }
      )
      .eq("project_id", projectId)
      .eq("translations.language_id", languageId)
      .order("key")
      .range(from, to);

    if (error) {
      throw error;
    }

    // Get translations for default language in a separate query
    if (defaultLanguageId) {
      const { data: defaultData, error: defaultError } = await this.supabase
        .from("translation_keys")
        .select(
          `
          id,
          translations!translations_key_id_fkey(
            id,
            key_id,
            content,
            language_id,
            status,
            translator_id,
            reviewer_id,
            created_at,
            updated_at
          )
        `
        )
        .eq("project_id", projectId)
        .eq("translations.language_id", defaultLanguageId)
        .in(
          "id",
          (data || []).map((k) => k.id)
        );

      if (defaultError) {
        throw defaultError;
      }

      // Merge the translations
      if (data && defaultData) {
        data.forEach((key) => {
          const defaultTranslations =
            defaultData.find((d) => d.id === key.id)?.translations || [];

          key.translations = [...key.translations, ...defaultTranslations];
        });
      }
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

  async getLatestVersionNumber(translationId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from("version_history")
      .select("version_number")
      .eq("translation_id", translationId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get latest version number: ${error.message}`);
    }

    return data?.version_number || 0;
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
  ): Promise<{
    translationKey: TranslationKey;
    translations: Translation[];
  }> {
    // Create the translation key
    const { data: translationKey, error: keyError } = await this.supabase
      .from("translation_keys")
      .insert({
        project_id: projectId,
        key,
        description,
      })
      .select()
      .single();

    if (keyError) {
      throw new Error(`Failed to create translation key: ${keyError.message}`);
    }

    // Create the translations
    const { data: createdTranslations, error: translationsError } =
      await this.supabase.from("translations").insert(
        translations.map((t) => ({
          key_id: translationKey.id,
          language_id: t.languageId,
          content: t.content,
          translator_id: t.userId,
          status: "approved" as const,
        }))
      ).select(`
        *,
        translation_keys (
          project_id
        )
      `);

    if (translationsError) {
      throw new Error(
        `Failed to create translations: ${translationsError.message}`
      );
    }

    // Create version history entries for each translation
    const versionEntries = createdTranslations.map((translation) => ({
      translation_id: translation.id,
      content: translation.content,
      changed_by: translation.translator_id || "", // Handle null case
      version_name: "Initial translation",
      version_number: 1,
    }));

    const { error: versionError } = await this.supabase
      .from("version_history")
      .insert(versionEntries);

    if (versionError) {
      throw new Error(
        `Failed to create version history: ${versionError.message}`
      );
    }

    return {
      translationKey,
      translations: createdTranslations as Translation[],
    };
  }
}
