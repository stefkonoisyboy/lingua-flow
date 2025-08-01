import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { DI_TOKENS } from "../../lib/di/registry";
import { IAISuggestionsService } from "../../lib/di/interfaces/service.interfaces";
import { requireProjectPermission } from "../middleware/requireProjectPermission";

export const aiSuggestionsRouter = router({
  getSuggestion: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        translationKeyId: z.string().uuid(),
        targetLanguageId: z.string().uuid(),
      })
    )
    .use(requireProjectPermission(["owner", "translator"]))
    .mutation(async ({ ctx, input }) => {
      const aiSuggestionsService = ctx.container.resolve<IAISuggestionsService>(
        DI_TOKENS.AI_SUGGESTIONS_SERVICE
      );

      return await aiSuggestionsService.getSuggestion(
        ctx.user.id,
        input.projectId,
        input.translationKeyId,
        input.targetLanguageId
      );
    }),

  applySuggestion: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        translationId: z.string().uuid(),
        suggestedText: z.string().min(1),
        modelUsed: z.string().min(1),
      })
    )
    .use(requireProjectPermission(["owner", "translator"]))
    .mutation(async ({ ctx, input }) => {
      const aiSuggestionsService = ctx.container.resolve<IAISuggestionsService>(
        DI_TOKENS.AI_SUGGESTIONS_SERVICE
      );

      return await aiSuggestionsService.applySuggestion(
        input.projectId,
        input.translationId,
        input.suggestedText,
        input.modelUsed,
        ctx.user.id
      );
    }),
});
