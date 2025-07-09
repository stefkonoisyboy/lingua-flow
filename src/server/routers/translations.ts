import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { DI_TOKENS } from "../../lib/di/registry";
import { ITranslationsService } from "../../lib/di/interfaces/service.interfaces";

export const translationsRouter = router({
  getTranslationKeys: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
        languageId: z.string().optional(),
        defaultLanguageId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const translationsService = ctx.container.resolve<ITranslationsService>(
        DI_TOKENS.TRANSLATIONS_SERVICE
      );

      return translationsService.getTranslationKeys(
        input.projectId,
        input.page,
        input.pageSize,
        input.languageId,
        input.defaultLanguageId
      );
    }),
});
