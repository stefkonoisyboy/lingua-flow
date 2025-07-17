import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { ISyncHistoryDAL } from "../di/interfaces/dal.interfaces";
import { CreateSyncHistoryParamsDAL } from "../di/interfaces/dal.interfaces";

export class SyncHistoryDAL implements ISyncHistoryDAL {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(data: CreateSyncHistoryParamsDAL) {
    const { projectId, integrationId, status, details } = data;

    await this.supabase.from("sync_history").insert({
      project_id: projectId,
      integration_id: integrationId,
      status,
      details,
    });
  }

  async getByProjectId(projectId: string) {
    const { data, error } = await this.supabase
      .from("sync_history")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    return data;
  }

  async getLatestSync(projectId: string, integrationId: string) {
    const { data, error } = await this.supabase
      .from("sync_history")
      .select("*")
      .eq("project_id", projectId)
      .eq("integration_id", integrationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch latest sync: ${error.message}`);
    }
    return data || null;
  }
}
