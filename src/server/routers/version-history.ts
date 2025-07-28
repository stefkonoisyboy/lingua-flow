import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { IVersionHistoryService } from "../../lib/di/interfaces/service.interfaces";
import { DI_TOKENS } from "@/lib/di/registry";
import { requireProjectPermission } from "../middleware/requireProjectPermission";

export const versionHistoryRouter = router({
  getVersionHistory: protectedProcedure
    .input(
      z.object({
        translationId: z.string().uuid(),
        projectId: z.string(),
      })
    )
    .use(requireProjectPermission(["owner", "translator", "viewer"]))
    .query(async ({ ctx, input }) => {
      const versionHistoryService =
        ctx.container.resolve<IVersionHistoryService>(
          DI_TOKENS.VERSION_HISTORY_SERVICE
        );

      return await versionHistoryService.getVersionHistory(input.translationId);
    }),

  revertTranslationToVersion: protectedProcedure
    .input(
      z.object({
        translationId: z.string().uuid(),
        versionId: z.string().uuid(),
        projectId: z.string(),
      })
    )
    .use(requireProjectPermission(["owner", "translator"]))
    .mutation(async ({ ctx, input }) => {
      const versionHistoryService =
        ctx.container.resolve<IVersionHistoryService>(
          DI_TOKENS.VERSION_HISTORY_SERVICE
        );

      return await versionHistoryService.revertTranslationToVersion(
        input.translationId,
        input.versionId,
        ctx.user.id
      );
    }),
});
