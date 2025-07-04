import { protectedProcedure, router } from "../trpc";
import { ILanguagesService } from "@/lib/di/interfaces/service.interfaces";
import { DI_TOKENS } from "@/lib/di/registry";

export const languagesRouter = router({
  getLanguages: protectedProcedure.query(async ({ ctx }) => {
    const languagesService = ctx.container.resolve<ILanguagesService>(
      DI_TOKENS.LANGUAGES_SERVICE
    );

    return languagesService.getAllLanguages();
  }),
});
