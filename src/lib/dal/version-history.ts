import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

export class VersionHistoryDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  async createVersion(
    translationId: string,
    content: string,
    changedBy: string,
    versionName: string
  ) {
    // Get the latest version number for this translation
    const { data: versions, error: versionsError } = await this.supabase
      .from("version_history")
      .select("version_number")
      .eq("translation_id", translationId)
      .order("version_number", { ascending: false })
      .limit(1);

    if (versionsError) {
      throw new Error(`Failed to get latest version: ${versionsError.message}`);
    }

    const nextVersionNumber =
      versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

    const { data, error } = await this.supabase
      .from("version_history")
      .insert({
        translation_id: translationId,
        content,
        changed_by: changedBy,
        version_name: versionName,
        version_number: nextVersionNumber,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create version: ${error.message}`);
    }

    return data;
  }

  async getVersionHistory(translationId: string) {
    const { data, error } = await this.supabase
      .from("version_history")
      .select()
      .eq("translation_id", translationId)
      .order("version_number", { ascending: false });

    if (error) {
      throw new Error(`Failed to get version history: ${error.message}`);
    }

    return data;
  }
}
