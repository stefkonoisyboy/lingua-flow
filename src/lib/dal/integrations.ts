import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "../types/database.types";
import {
  IIntegrationsDAL,
  IPaginationDAL,
  CreateSyncHistoryParams,
} from "../di/interfaces/dal.interfaces";

export type IntegrationType = Database["public"]["Enums"]["integration_type"];

export interface IntegrationConfig {
  [key: string]: string | undefined;
  repository?: string;
  branch?: string;
  translationPath?: string;
  filePattern?: string;
  accessToken?: string;
}

export class IntegrationsDAL implements IIntegrationsDAL {
  constructor(
    private supabase: SupabaseClient<Database>,
    private paginationDal: IPaginationDAL
  ) {}

  async createIntegration(
    projectId: string,
    type: IntegrationType,
    config: IntegrationConfig,
    isConnected: boolean = true
  ) {
    const { data: integration, error } = await this.supabase
      .from("project_integrations")
      .insert({
        project_id: projectId,
        type,
        config: config as unknown as Json,
        is_connected: isConnected,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating integration: ${error.message}`);
    }

    return integration;
  }

  async getProjectIntegration(projectId: string) {
    const { data: integration, error } = await this.supabase
      .from("project_integrations")
      .select("*")
      .eq("project_id", projectId)
      .single();

    // If no integration found, return null
    if (error && error.code === "PGRST116") {
      return null;
    }

    if (error) {
      throw new Error(`Error fetching project integration: ${error.message}`);
    }

    return integration;
  }

  async updateIntegrationConfig(
    integrationId: string,
    config: Partial<IntegrationConfig>
  ) {
    const { data: integration, error } = await this.supabase
      .from("project_integrations")
      .update({
        config: config as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integrationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating integration config: ${error.message}`);
    }

    return integration;
  }

  async updateIntegrationStatus(
    integrationId: string,
    isConnected: boolean,
    lastSyncedAt?: string
  ) {
    const updateData: Partial<
      Database["public"]["Tables"]["project_integrations"]["Update"]
    > = {
      is_connected: isConnected,
      updated_at: new Date().toISOString(),
    };

    if (lastSyncedAt) {
      updateData.last_synced_at = lastSyncedAt;
    }

    const { data: integration, error } = await this.supabase
      .from("project_integrations")
      .update(updateData)
      .eq("id", integrationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating integration status: ${error.message}`);
    }

    return integration;
  }

  async deleteIntegration(integrationId: string) {
    const { error } = await this.supabase
      .from("project_integrations")
      .delete()
      .eq("id", integrationId);

    if (error) {
      throw new Error(`Error deleting integration: ${error.message}`);
    }
  }

  async createGitHubIntegration(
    projectId: string,
    config: {
      repository: string;
      branch: string;
      translationPath?: string;
      filePattern?: string;
    }
  ) {
    return await this.createIntegration(projectId, "github", config);
  }

  async getProjectTranslationsForExport(
    projectId: string,
    languageId?: string
  ) {
    let query = this.supabase
      .from("translations")
      .select(
        `
        content,
        translation_keys (
          key
        ),
        languages (
          code
        )
      `
      )
      .eq("status", "approved")
      .eq("translation_keys.project_id", projectId);

    if (languageId) {
      query = query.eq("language_id", languageId);
    }

    const data = await this.paginationDal.fetchAllPages<{
      content: string;
      translation_keys: {
        key: string;
      };
      languages: {
        code: string;
      };
    }>(query);

    return data.map((t) => ({
      key: t.translation_keys?.key,
      content: t.content,
      language: t.languages?.code,
    }));
  }

  async getProjectLanguagesForExport(projectId: string) {
    const { data, error } = await this.supabase
      .from("project_languages")
      .select(
        `
        languages (
          id,
          code
        )
      `
      )
      .eq("project_id", projectId);

    if (error) {
      throw new Error(
        `Error fetching project languages for export: ${error.message}`
      );
    }

    return data.map((pl) => ({
      id: pl.languages.id,
      code: pl.languages.code,
    }));
  }

  async createSyncHistory(data: CreateSyncHistoryParams) {
    const { error } = await this.supabase.from("sync_history").insert(data);

    if (error) {
      throw new Error(`Error creating sync history: ${error.message}`);
    }
  }
}
