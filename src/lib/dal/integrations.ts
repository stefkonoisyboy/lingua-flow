import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "../types/database.types";
import { IIntegrationsDAL } from "../di/interfaces/dal.interfaces";

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
  constructor(private supabase: SupabaseClient<Database>) {}

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
}
