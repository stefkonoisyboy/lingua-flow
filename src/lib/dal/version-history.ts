import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { PaginationDAL } from "./pagination";

type VersionHistory = Database["public"]["Tables"]["version_history"]["Row"];

export class VersionHistoryDAL {
  private paginationDal: PaginationDAL;

  constructor(private supabase: SupabaseClient<Database>) {
    this.paginationDal = new PaginationDAL(supabase);
  }

  private async fetchAllPages<T>(
    query: ReturnType<typeof this.supabase.from>,
    pageSize: number = 1000
  ): Promise<T[]> {
    let allData: T[] = [];
    let lastPage = false;
    let page = 0;

    while (!lastPage) {
      const { data, error } = await query.range(
        page * pageSize,
        (page + 1) * pageSize - 1
      );

      if (error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
      }

      if (!data || data.length === 0) {
        break;
      }

      allData = [...allData, ...data];

      if (data.length < pageSize) {
        lastPage = true;
      }

      page++;
    }

    return allData;
  }

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

  async getVersionHistory(translationId: string): Promise<VersionHistory[]> {
    const query = this.supabase
      .from("version_history")
      .select()
      .eq("translation_id", translationId)
      .order("version_number", { ascending: false });

    return this.paginationDal.fetchAllPages<VersionHistory>(query);
  }

  async getVersionHistoryForTranslations(
    translationIds: string[]
  ): Promise<VersionHistory[]> {
    const query = this.supabase
      .from("version_history")
      .select()
      .in("translation_id", translationIds)
      .order("version_number", { ascending: false });

    return this.paginationDal.fetchAllPages<VersionHistory>(query);
  }
}
