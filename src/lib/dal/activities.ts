import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { IActivitiesDAL } from "../di/interfaces/dal.interfaces";

export type ActivityType =
  | "translation_updated"
  | "language_added"
  | "comment_added"
  | "member_added"
  | "member_removed"
  | "member_updated"
  | "invitation_sent"
  | "invitation_accepted"
  | "invitation_rejected"
  | "invitation_cancelled"
  | "integration_connected"
  | "integration_disconnected"
  | "sync_completed";

export type ActivityDetails = {
  action?: string;
  projectName?: string;
  [key: string]: string | number | boolean | null | undefined;
};

export class ActivitiesDAL implements IActivitiesDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getRecentActivities(projectIds: string[]) {
    const { data: activities, error } = await this.supabase
      .from("activity_log")
      .select(
        `
        *,
        projects (
          id,
          name
        )
      `
      )
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(`Error fetching activities: ${error.message}`);
    }

    return activities;
  }

  async logActivity(
    projectId: string,
    userId: string,
    type: ActivityType,
    details: ActivityDetails
  ) {
    const { error: activityError } = await this.supabase
      .from("activity_log")
      .insert({
        project_id: projectId,
        user_id: userId,
        activity_type: type,
        details:
          details as Database["public"]["Tables"]["activity_log"]["Row"]["details"],
      });

    if (activityError) {
      throw new Error(`Error logging activity: ${activityError.message}`);
    }
  }
}
