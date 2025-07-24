import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { DI_TOKENS } from "../../lib/di/registry";
import { ITranslationsService } from "../../lib/di/interfaces/service.interfaces";
import { requireProjectPermission } from "../middleware/requireProjectPermission";

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
    .use(requireProjectPermission(["owner", "translator", "viewer"]))
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
    .use(requireProjectPermission(["owner", "translator"]))
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

  updateTranslationKey: protectedProcedure
    .input(
      z.object({
        keyId: z.string(),
        newKey: z.string(),
        projectId: z.string(),
      })
    )
    .use(requireProjectPermission(["owner", "translator"]))
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
        projectId: z.string(),
      })
    )
    .use(requireProjectPermission(["owner", "translator"]))
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
        projectId: z.string(),
      })
    )
    .use(requireProjectPermission(["owner", "translator"]))
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

  exportTranslations: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        languageIds: z.array(z.string()),
      })
    )
    .use(requireProjectPermission(["owner"]))
    .mutation(async ({ input, ctx }) => {
      const translationsService = ctx.container.resolve<ITranslationsService>(
        DI_TOKENS.TRANSLATIONS_SERVICE
      );

      return await translationsService.exportToJSON(
        input.projectId,
        input.languageIds
      );
    }),

  importTranslations: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        languageId: z.string(),
        fileContent: z.string(), // JSON file content as string
        fileName: z.string(),
        importMode: z.enum(["merge", "replace"]),
      })
    )
    .use(requireProjectPermission(["owner"]))
    .mutation(async ({ input, ctx }) => {
      const translationsService = ctx.container.resolve<ITranslationsService>(
        DI_TOKENS.TRANSLATIONS_SERVICE
      );

      return await translationsService.importFromJSON(
        input.projectId,
        input.languageId,
        input.fileContent,
        input.importMode,
        ctx.user.id
      );
    }),
});
