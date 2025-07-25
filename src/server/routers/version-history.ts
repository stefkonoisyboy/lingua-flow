import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { IVersionHistoryService } from "../../lib/di/interfaces/service.interfaces";
import { DI_TOKENS } from "@/lib/di/registry";

export const versionHistoryRouter = router({
  getVersionHistory: protectedProcedure
    .input(
      z.object({
        translationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const versionHistoryService =
        ctx.container.resolve<IVersionHistoryService>(
          DI_TOKENS.VERSION_HISTORY_SERVICE
        );

      return await versionHistoryService.getVersionHistory(input.translationId);
    }),

  getVersionHistoryForTranslations: protectedProcedure
    .input(
      z.object({
        translationIds: z.array(z.string().uuid()),
      })
    )
    .query(async ({ ctx, input }) => {
      const versionHistoryService =
        ctx.container.resolve<IVersionHistoryService>(
          DI_TOKENS.VERSION_HISTORY_SERVICE
        );

      return await versionHistoryService.getVersionHistoryForTranslations(
        input.translationIds
      );
    }),

  revertTranslationToVersion: protectedProcedure
    .input(
      z.object({
        translationId: z.string().uuid(),
        versionId: z.string().uuid(),
      })
    )
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
