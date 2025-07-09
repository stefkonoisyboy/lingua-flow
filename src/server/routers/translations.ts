import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { DI_TOKENS } from "../../lib/di/registry";
import { ITranslationsService } from "../../lib/di/interfaces/service.interfaces";

export const translationsRouter = router({
  getProjectTranslations: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        languageId: z.string(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const translationsService = ctx.container.resolve<ITranslationsService>(
        DI_TOKENS.TRANSLATIONS_SERVICE
      );

      return translationsService.getProjectTranslations(
        input.projectId,
        input.languageId,
        input.page,
        input.pageSize
      );
    }),

  getTranslationKeys: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const translationsService = ctx.container.resolve<ITranslationsService>(
        DI_TOKENS.TRANSLATIONS_SERVICE
      );
      return translationsService.getTranslationKeys(
        input.projectId,
        input.page,
        input.pageSize
      );
    }),
});
