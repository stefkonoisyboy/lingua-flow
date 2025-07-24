import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { ICommentsService } from "../../lib/di/interfaces/service.interfaces";
import { DI_TOKENS } from "@/lib/di/registry";
import { requireProjectPermission } from "../middleware/requireProjectPermission";

export const commentsRouter = router({
  getComments: protectedProcedure
    .input(
      z.object({
        translationId: z.string().uuid(),
        projectId: z.string().uuid(),
      })
    )
    .use(requireProjectPermission(["owner", "translator", "viewer"]))
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
        projectId: z.string().uuid(),
      })
    )
    .use(requireProjectPermission(["owner", "translator", "viewer"]))
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
        projectId: z.string().uuid(),
      })
    )
    .use(requireProjectPermission(["owner", "translator", "viewer"]))
    .mutation(async ({ ctx, input }) => {
      const commentsService = ctx.container.resolve<ICommentsService>(
        DI_TOKENS.COMMENTS_SERVICE
      );

      await commentsService.deleteComment(input.commentId);
    }),
});
