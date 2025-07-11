import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { ICommentsService } from "../../lib/di/interfaces/service.interfaces";
import { DI_TOKENS } from "@/lib/di/registry";

export const commentsRouter = router({
  getComments: protectedProcedure
    .input(
      z.object({
        translationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const commentsService = ctx.container.resolve<ICommentsService>(
        DI_TOKENS.COMMENTS_SERVICE
      );

      return await commentsService.getComments(input.translationId);
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        translationId: z.string().uuid(),
        content: z.string().min(1, "Comment cannot be empty"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const commentsService = ctx.container.resolve<ICommentsService>(
        DI_TOKENS.COMMENTS_SERVICE
      );

      return await commentsService.addComment(
        input.translationId,
        ctx.user.id,
        input.content
      );
    }),

  deleteComment: protectedProcedure
    .input(
      z.object({
        commentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const commentsService = ctx.container.resolve<ICommentsService>(
        DI_TOKENS.COMMENTS_SERVICE
      );

      await commentsService.deleteComment(input.commentId);
    }),
});
