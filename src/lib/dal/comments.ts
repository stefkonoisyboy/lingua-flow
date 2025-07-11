import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { ICommentsDAL } from "../di/interfaces/dal.interfaces";

type CommentWithUser = Database["public"]["Tables"]["comments"]["Row"] & {
  user: {
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

export class CommentsDAL implements ICommentsDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getComments(translationId: string) {
    const { data, error } = await this.supabase
      .from("comments")
      .select(
        `
        *,
        user:user_id (
          email,
          full_name,
          avatar_url
        )
      `
      )
      .eq("translation_id", translationId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Error fetching comments: ${error.message}`);
    }

    return data as CommentWithUser[];
  }

  async addComment(translationId: string, userId: string, content: string) {
    const { data, error } = await this.supabase
      .from("comments")
      .insert({
        translation_id: translationId,
        user_id: userId,
        content,
      })
      .select(
        `
        *,
        user:user_id (
          email,
          full_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Error adding comment: ${error.message}`);
    }

    return data as CommentWithUser;
  }

  async deleteComment(commentId: string) {
    const { error } = await this.supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      throw new Error(`Error deleting comment: ${error.message}`);
    }
  }

  async getTranslationProjectId(translationId: string) {
    const { data, error } = await this.supabase
      .from("translations")
      .select("translation_keys!inner(project_id)")
      .eq("id", translationId)
      .single();

    if (error) {
      throw new Error(
        `Error fetching translation project ID: ${error.message}`
      );
    }

    return data?.translation_keys?.project_id || null;
  }
}
