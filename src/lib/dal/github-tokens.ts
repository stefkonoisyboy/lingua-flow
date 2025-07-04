import { SupabaseClient } from "@supabase/supabase-js";
import { IGitHubTokensDAL } from "../di/interfaces/dal.interfaces";
import { Database } from "../types/database.types";

export class GitHubTokensDAL implements IGitHubTokensDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getAccessToken(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("github_tokens")
      .select("access_token")
      .eq("user_id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch token data: ${error.message}`);
    }

    return data?.access_token || null;
  }

  async saveAccessToken(userId: string, accessToken: string): Promise<void> {
    const { error } = await this.supabase
      .from("github_tokens")
      .upsert({ user_id: userId, access_token: accessToken });

    if (error) {
      throw new Error(`Failed to save token: ${error.message}`);
    }
  }
}
