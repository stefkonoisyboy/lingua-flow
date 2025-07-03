import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { PaginationDAL } from "./pagination";

type TranslationKey = Database["public"]["Tables"]["translation_keys"]["Row"];
type Translation = Database["public"]["Tables"]["translations"]["Row"] & {
  translation_keys: Pick<TranslationKey, "project_id">;
};

interface TranslationKeyInsert {
  project_id: string;
  key: string;
  source_content: string;
  description?: string;
}

interface TranslationInsert {
  key_id: string;
  language_id: string;
  content: string;
  translator_id: string;
  status: "approved";
}

export class TranslationsDAL {
  private paginationDal: PaginationDAL;

  constructor(private supabase: SupabaseClient<Database>) {
    this.paginationDal = new PaginationDAL(supabase);
  }

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

    return this.paginationDal.fetchAllPages<TranslationKey>(query);
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

    return this.paginationDal.fetchAllPages<Translation>(query);
  }
}
