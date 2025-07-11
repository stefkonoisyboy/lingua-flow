import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import {
  IPaginationDAL,
  IVersionHistoryDAL,
} from "../di/interfaces/dal.interfaces";
import { DEFAULT_PAGE_SIZE } from "./pagination";

type VersionHistory = Database["public"]["Tables"]["version_history"]["Row"] & {
  user: {
    email: string | null;
  };
};

export class VersionHistoryDAL implements IVersionHistoryDAL {
  constructor(
    private supabase: SupabaseClient<Database>,
    private paginationDal: IPaginationDAL
  ) {}

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
      .select(
        `
        *,
        user:profiles!version_history_changed_by_fkey (
          email
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create version: ${error.message}`);
    }

    return data;
  }

  async getVersionHistory(translationId: string): Promise<VersionHistory[]> {
    const query = this.supabase
      .from("version_history")
      .select(
        `
        *,
        user:profiles!version_history_changed_by_fkey (
          email
        )
      `
      )
      .eq("translation_id", translationId)
      .order("version_number", { ascending: false });

    return this.paginationDal.fetchAllPages<VersionHistory>(
      query,
      DEFAULT_PAGE_SIZE
    );
  }

  async getVersionHistoryForTranslations(
    translationIds: string[]
  ): Promise<VersionHistory[]> {
    const query = this.supabase
      .from("version_history")
      .select(
        `
        *,
        user:profiles!version_history_changed_by_fkey (
          email
        )
      `
      )
      .in("translation_id", translationIds)
      .order("version_number", { ascending: false });

    return this.paginationDal.fetchAllPages<VersionHistory>(
      query,
      DEFAULT_PAGE_SIZE
    );
  }
}
