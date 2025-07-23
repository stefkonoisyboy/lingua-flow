import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import {
  ITranslationsDAL,
  IPaginationDAL,
  TranslationKey,
  Translation,
  TranslationInsert,
} from "../di/interfaces/dal.interfaces";
import { DEFAULT_PAGE_SIZE } from "./pagination";

interface TranslationKeyInsert {
  project_id: string;
  key: string;
  description?: string;
  updated_at?: string;
}

type TranslationWithKey = Translation & {
  translation_keys: { key: string; project_id: string };
};

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

  async getProjectTranslationKeys(projectIds: string[]) {
    const query = this.supabase
      .from("translation_keys")
      .select()
      .in("project_id", projectIds);

    return await this.paginationDal.fetchAllPages<TranslationKey>(
      query,
      DEFAULT_PAGE_SIZE
    );
  }

  async getProjectTranslations(projectIds: string[]) {
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

    return await this.paginationDal.fetchAllPages<Translation>(
      query,
      DEFAULT_PAGE_SIZE
    );
  }

  /**
   * Fetch all translations for a project and language as a map of key to translation.
   */
  async getProjectTranslationsMap(projectId: string, languageId: string) {
    // First, fetch all translation key IDs for the project
    const { data: keyData, error: keyError } = await this.supabase
      .from("translation_keys")
      .select("id, key")
      .eq("project_id", projectId);

    if (keyError) {
      throw new Error(`Failed to fetch translation keys: ${keyError.message}`);
    }

    const keyIds = (keyData || []).map((k) => k.id);

    if (keyIds.length === 0) {
      return {};
    }

    // Batch keyIds to avoid URI too large errors
    const BATCH_SIZE = 100;
    let allData: TranslationWithKey[] = [];

    for (let i = 0; i < keyIds.length; i += BATCH_SIZE) {
      const chunk = keyIds.slice(i, i + BATCH_SIZE);

      const { data, error } = await this.supabase
        .from("translations")
        .select(`*, translation_keys!inner(key, project_id)`)
        .eq("language_id", languageId)
        .in("key_id", chunk)
        .order("key_id", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch translations map: ${error.message}`);
      }

      allData = allData.concat(data || []);
    }

    // Map by key (from translation_keys)
    const map: Record<string, TranslationWithKey> = {};

    (allData || []).forEach((t) => {
      if (t.translation_keys && t.translation_keys.key) {
        map[t.translation_keys.key] = t;
      }
    });

    return map;
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
          entry_order,
          created_at,
          updated_at,
          comments(count)
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
            entry_order,
            created_at,
            updated_at,
            comments(count)
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
    translations: TranslationInsert[],
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

  async getLatestVersionNumber(translationId: string) {
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

  async getLatestVersionNumbers(
    translationIds: string[]
  ): Promise<{ translation_id: string; version_number: number }[]> {
    if (!translationIds.length) {
      return [];
    }

    const BATCH_SIZE = 100;
    const allRows: { translation_id: string; version_number: number }[] = [];

    for (let i = 0; i < translationIds.length; i += BATCH_SIZE) {
      const batch = translationIds.slice(i, i + BATCH_SIZE);

      const { data, error } = await this.supabase
        .from("version_history")
        .select("translation_id, version_number")
        .in("translation_id", batch)
        .order("version_number", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch version numbers: ${error.message}`);
      }

      if (data) {
        allRows.push(...data);
      }
    }

    // For each translation_id, keep only the highest version_number
    const versionMap = new Map<string, number>();

    for (const row of allRows) {
      if (!versionMap.has(row.translation_id)) {
        versionMap.set(row.translation_id, row.version_number);
      }
    }

    return Array.from(versionMap.entries()).map(
      ([translation_id, version_number]) => ({ translation_id, version_number })
    );
  }

  async updateTranslationKey(keyId: string, newKey: string) {
    const { data, error } = await this.supabase
      .from("translation_keys")
      .update({
        key: newKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", keyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update translation key: ${error.message}`);
    }

    return data;
  }

  async updateTranslation(
    translationId: string,
    content: string,
    userId: string
  ) {
    // Get the current version number
    const currentVersion = await this.getLatestVersionNumber(translationId);

    // Get the current translation to store in version history
    const { data: currentTranslation, error: currentError } =
      await this.supabase
        .from("translations")
        .select()
        .eq("id", translationId)
        .single();

    if (currentError) {
      throw new Error(
        `Failed to get current translation: ${currentError.message}`
      );
    }

    // Create version history entry for the current version
    const { error: versionError } = await this.supabase
      .from("version_history")
      .insert({
        translation_id: translationId,
        content: currentTranslation.content,
        changed_by: userId,
        version_name: "Manual update",
        version_number: currentVersion + 1,
      });

    if (versionError) {
      throw new Error(
        `Failed to create version history: ${versionError.message}`
      );
    }

    // Update the translation with new content
    const { data, error } = await this.supabase
      .from("translations")
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", translationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update translation: ${error.message}`);
    }

    return data;
  }

  async createTranslation(
    keyId: string,
    languageId: string,
    content: string,
    userId: string
  ) {
    const { data: keyData, error: keyError } = await this.supabase
      .from("translation_keys")
      .select("project_id")
      .eq("id", keyId)
      .single();

    if (keyError) {
      throw new Error(`Failed to get translation key: ${keyError.message}`);
    }

    const projectId = keyData?.project_id;

    const { data: maxOrderData, error: maxOrderError } = await this.supabase
      .from("translations")
      .select("entry_order, translation_keys!inner(project_id)")
      .eq("language_id", languageId)
      .eq("translation_keys.project_id", projectId)
      .order("entry_order", { ascending: false })
      .limit(1)
      .single();

    if (maxOrderError && maxOrderError.code !== "PGRST116") {
      throw new Error(
        `Failed to get max entry_order: ${maxOrderError.message}`
      );
    }

    const nextOrder =
      typeof maxOrderData?.entry_order === "number"
        ? maxOrderData.entry_order + 1
        : 0;

    // Create the new translation
    const { data, error } = await this.supabase
      .from("translations")
      .insert({
        key_id: keyId,
        language_id: languageId,
        content,
        translator_id: userId,
        status: "approved",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        entry_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create translation: ${error.message}`);
    }

    // Create initial version history entry
    const { error: versionError } = await this.supabase
      .from("version_history")
      .insert({
        translation_id: data.id,
        content,
        changed_by: userId,
        version_name: "Initial translation",
        version_number: 1,
      });

    if (versionError) {
      throw new Error(
        `Failed to create version history: ${versionError.message}`
      );
    }

    return data;
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

    // For each language, get the max entry_order and assign incrementally
    // Group translations by language
    const translationsByLanguage = translations.reduce((acc, t) => {
      if (!acc[t.languageId]) {
        acc[t.languageId] = [];
      }

      acc[t.languageId].push(t);
      return acc;
    }, {} as Record<string, typeof translations>);

    // Use the correct type for translationsWithOrder
    const translationsWithOrder: {
      key_id: string;
      language_id: string;
      content: string;
      translator_id: string;
      status: "approved";
      entry_order: number;
    }[] = [];

    for (const [languageId, langTranslations] of Object.entries(
      translationsByLanguage
    )) {
      // Get max entry_order for this project and language
      const { data: maxOrderData, error: maxOrderError } = await this.supabase
        .from("translations")
        .select("entry_order, translation_keys!inner(project_id)")
        .eq("language_id", languageId)
        .eq("translation_keys.project_id", projectId)
        .order("entry_order", { ascending: false })
        .limit(1)
        .single();

      if (maxOrderError && maxOrderError.code !== "PGRST116") {
        throw new Error(
          `Failed to get max entry_order: ${maxOrderError.message}`
        );
      }

      let nextOrder =
        typeof maxOrderData?.entry_order === "number"
          ? maxOrderData.entry_order + 1
          : 0;

      for (const t of langTranslations) {
        translationsWithOrder.push({
          key_id: translationKey.id,
          language_id: t.languageId,
          content: t.content,
          translator_id: t.userId,
          status: "approved" as const,
          entry_order: nextOrder++,
        });
      }
    }

    // Create the translations
    const { data: createdTranslations, error: translationsError } =
      await this.supabase
        .from("translations")
        .insert(translationsWithOrder)
        .select(
          `
        *,
        translation_keys (
          project_id
        )
      `
        );

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

  async deleteTranslationsForLanguage(projectId: string, languageId: string) {
    // First, get all translation keys for this project using pagination
    const query = this.supabase
      .from("translation_keys")
      .select("id")
      .eq("project_id", projectId);

    const keys = await this.paginationDal.fetchAllPages<{ id: string }>(
      query,
      DEFAULT_PAGE_SIZE
    );

    if (!keys || keys.length === 0) {
      return;
    }

    // Process deletions in batches of 100
    const BATCH_SIZE = 100;

    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batchKeyIds = keys.slice(i, i + BATCH_SIZE).map((key) => key.id);

      const { error: deleteError } = await this.supabase
        .from("translations")
        .delete()
        .in("key_id", batchKeyIds)
        .eq("language_id", languageId);

      if (deleteError) {
        throw new Error(`Error deleting translations: ${deleteError.message}`);
      }
    }
  }

  async getMaxEntryOrder(projectId: string, languageId: string) {
    // Query translations for this language, get max entry_order
    const { data: maxData, error: maxError } = await this.supabase
      .from("translations")
      .select("entry_order, translation_keys!inner(project_id)")
      .eq("language_id", languageId)
      .eq("translation_keys.project_id", projectId)
      .order("entry_order", { ascending: false })
      .limit(1)
      .single();

    if (maxError && maxError.code !== "PGRST116") {
      throw new Error(`Failed to fetch max entry_order: ${maxError.message}`);
    }

    return typeof maxData?.entry_order === "number" ? maxData.entry_order : -1;
  }

  async getTranslationsByKeyAndLanguage(
    pairs: { key_id: string; language_id: string }[]
  ) {
    if (!pairs.length) {
      return [];
    }

    const results: Translation[] = [];
    const BATCH_SIZE = 100;

    for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
      const batch = pairs.slice(i, i + BATCH_SIZE);
      const keyIds = batch.map((p) => p.key_id);
      const languageIds = batch.map((p) => p.language_id);

      const { data, error } = await this.supabase
        .from("translations")
        .select(
          `
          *,
          translation_keys!inner(project_id)
        `
        )
        .in("key_id", keyIds)
        .in("language_id", languageIds);

      if (error) {
        throw new Error(`Failed to fetch translations: ${error.message}`);
      }

      if (data) {
        results.push(...data);
      }
    }
    return results;
  }

  async batchInsertVersionHistory(
    entries: {
      translation_id: string;
      content: string;
      changed_by: string;
      version_name: string;
      version_number: number;
    }[]
  ) {
    if (!entries.length) {
      return;
    }

    const { error } = await this.supabase
      .from("version_history")
      .insert(entries);

    if (error) {
      throw new Error(`Failed to insert version history: ${error.message}`);
    }
  }
}
