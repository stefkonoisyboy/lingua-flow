import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { requireProjectPermission } from "../middleware/requireProjectPermission";
import { DI_TOKENS } from "@/lib/di/registry";
import { ITranslationMemoryService } from "@/lib/di/interfaces/service.interfaces";

export const translationMemoryRouter = router({
  // Store a translation in memory
  storeTranslation: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        sourceLanguageId: z.string(),
        targetLanguageId: z.string(),
        sourceText: z.string(),
        targetText: z.string(),
        translationKeyName: z.string().optional(),
        context: z.any().optional(),
        qualityScore: z.number().min(0).max(1),
      })
    )
    .use(requireProjectPermission(["owner", "translator"]))
    .mutation(async ({ ctx, input }) => {
      const container = ctx.container;

      const translationMemoryService =
        container.resolve<ITranslationMemoryService>(
          DI_TOKENS.TRANSLATION_MEMORY_SERVICE
        );

      return await translationMemoryService.storeTranslation({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  // Find exact match in translation memory
  findExactMatch: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        sourceText: z.string(),
        targetLanguageId: z.string(),
      })
    )
    .use(requireProjectPermission(["owner", "translator"]))
    .query(async ({ ctx, input }) => {
      const container = ctx.container;

      const translationMemoryService =
        container.resolve<ITranslationMemoryService>(
          DI_TOKENS.TRANSLATION_MEMORY_SERVICE
        );

      return await translationMemoryService.findExactMatch(
        input.projectId,
        input.sourceText,
        input.targetLanguageId
      );
    }),

  // Find similar matches in translation memory
  findSimilarMatches: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        sourceText: z.string(),
        targetLanguageId: z.string(),
        threshold: z.number().min(0).max(1).default(0.7),
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .use(requireProjectPermission(["owner", "translator"]))
    .query(async ({ ctx, input }) => {
      const container = ctx.container;

      const translationMemoryService =
        container.resolve<ITranslationMemoryService>(
          DI_TOKENS.TRANSLATION_MEMORY_SERVICE
        );

      return await translationMemoryService.findSimilarMatches(
        input.projectId,
        input.sourceText,
        input.targetLanguageId,
        input.threshold,
        input.limit
      );
    }),

  // Get memory statistics for a project
  getMemoryStats: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .use(requireProjectPermission(["owner"]))
    .query(async ({ ctx, input }) => {
      const container = ctx.container;

      const translationMemoryService =
        container.resolve<ITranslationMemoryService>(
          DI_TOKENS.TRANSLATION_MEMORY_SERVICE
        );

      return await translationMemoryService.getMemoryStats(input.projectId);
    }),

  // Cleanup old memory entries (admin only)
  cleanupOldEntries: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        olderThanDays: z.number().min(1).max(365).default(180),
      })
    )
    .use(requireProjectPermission(["owner"]))
    .mutation(async ({ ctx, input }) => {
      const container = ctx.container;

      const translationMemoryService =
        container.resolve<ITranslationMemoryService>(
          DI_TOKENS.TRANSLATION_MEMORY_SERVICE
        );

      const deletedCount = await translationMemoryService.cleanupOldEntries(
        input.projectId,
        input.olderThanDays
      );

      return { deletedCount };
    }),
});
