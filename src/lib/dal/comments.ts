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

  async getComments(translationId: string): Promise<CommentWithUser[]> {
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

  async addComment(
    translationId: string,
    userId: string,
    content: string
  ): Promise<CommentWithUser> {
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

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await this.supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      throw new Error(`Error deleting comment: ${error.message}`);
    }
  }
}
