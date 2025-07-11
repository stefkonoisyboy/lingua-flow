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

      return await translationsService.getTranslationKeys(
        input.projectId,
        input.page,
        input.pageSize,
        input.languageId,
        input.defaultLanguageId
      );
    }),

  createTranslationKeyWithTranslations: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        key: z.string(),
        translations: z.array(
          z.object({
            languageId: z.string(),
            content: z.string(),
          })
        ),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const translationsService = ctx.container.resolve<ITranslationsService>(
        DI_TOKENS.TRANSLATIONS_SERVICE
      );

      return await translationsService.createTranslationKeyWithTranslations(
        input.projectId,
        input.key,
        input.translations.map((t) => ({
          ...t,
          userId: ctx.user.id,
        })),
        input.description
      );
    }),

  getLatestVersionNumber: protectedProcedure
    .input(
      z.object({
        translationId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const translationsService = ctx.container.resolve<ITranslationsService>(
        DI_TOKENS.TRANSLATIONS_SERVICE
      );

      return await translationsService.getLatestVersionNumber(
        input.translationId
      );
    }),

  updateTranslationKey: protectedProcedure
    .input(
      z.object({
        keyId: z.string(),
        newKey: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const translationsService = ctx.container.resolve<ITranslationsService>(
        DI_TOKENS.TRANSLATIONS_SERVICE
      );

      return await translationsService.updateTranslationKey(
        input.keyId,
        input.newKey
      );
    }),

  updateTranslation: protectedProcedure
    .input(
      z.object({
        translationId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const translationsService = ctx.container.resolve<ITranslationsService>(
        DI_TOKENS.TRANSLATIONS_SERVICE
      );

      return await translationsService.updateTranslation(
        input.translationId,
        input.content,
        ctx.user.id
      );
    }),

  createTranslation: protectedProcedure
    .input(
      z.object({
        keyId: z.string(),
        languageId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const translationsService = ctx.container.resolve<ITranslationsService>(
        DI_TOKENS.TRANSLATIONS_SERVICE
      );

      return await translationsService.createTranslation(
        input.keyId,
        input.languageId,
        input.content,
        ctx.user.id
      );
    }),
});
