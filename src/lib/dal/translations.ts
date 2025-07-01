import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { VersionHistoryDAL } from "./version-history";

export class TranslationsDAL {
  private versionHistoryDal: VersionHistoryDAL;

  constructor(private supabase: SupabaseClient<Database>) {
    this.versionHistoryDal = new VersionHistoryDAL(supabase);
  }

  async createTranslationKey(
    projectId: string,
    key: string,
    sourceContent: string,
    description?: string
  ) {
    const { data, error } = await this.supabase
      .from("translation_keys")
      .insert({
        project_id: projectId,
        key,
        source_content: sourceContent,
        description,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create translation key: ${error.message}`);
    }

    return data;
  }

  async createTranslation(
    keyId: string,
    languageId: string,
    content: string,
    translatorId: string,
    source: string = "github_import"
  ) {
    const { data, error } = await this.supabase
      .from("translations")
      .insert({
        key_id: keyId,
        language_id: languageId,
        content,
        translator_id: translatorId,
        status: "approved", // Since these are imported translations, mark them as approved
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create translation: ${error.message}`);
    }

    // Create initial version history entry
    await this.versionHistoryDal.createVersion(
      data.id,
      content,
      translatorId,
      `Initial import from ${source}`
    );

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

  async getProjectTranslations(projectIds: string[]) {
    const { data, error } = await this.supabase
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

    if (error) {
      throw new Error(`Failed to get project translations: ${error.message}`);
    }

    return data;
  }
}
