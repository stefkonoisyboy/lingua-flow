import { IActivitiesDAL, ICommentsDAL } from "../di/interfaces/dal.interfaces";
import { ICommentsService } from "../di/interfaces/service.interfaces";
import { Database } from "../types/database.types";

type CommentWithUser = Database["public"]["Tables"]["comments"]["Row"] & {
  user: {
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

export class CommentsService implements ICommentsService {
  constructor(
    private commentsDAL: ICommentsDAL,
    private activitiesDAL: IActivitiesDAL
  ) {}

  async getComments(translationId: string): Promise<CommentWithUser[]> {
    return this.commentsDAL.getComments(translationId);
  }

  async addComment(
    translationId: string,
    userId: string,
    content: string
  ): Promise<CommentWithUser> {
    const comment = await this.commentsDAL.addComment(
      translationId,
      userId,
      content
    );

    // Get the project ID from the translation
    const projectId = await this.commentsDAL.getTranslationProjectId(
      translationId
    );

    if (projectId) {
      // Log the activity
      await this.activitiesDAL.logActivity(projectId, userId, "comment_added", {
        translationId,
        commentId: comment.id,
        content: content.substring(0, 100), // Store first 100 chars for preview
      });
    }

    return comment;
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.commentsDAL.deleteComment(commentId);
  }
}
