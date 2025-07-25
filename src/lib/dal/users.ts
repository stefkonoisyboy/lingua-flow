import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { IUsersDAL, Profile } from "../di/interfaces/dal.interfaces";

export class UsersDAL implements IUsersDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  // Users
  async getUserByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .ilike("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data ?? null;
  }
}
