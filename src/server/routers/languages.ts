import { protectedProcedure, router } from '../trpc';
import { LanguagesService } from '../../lib/services/languages.service';

export const languagesRouter = router({
  getLanguages: protectedProcedure.query(async ({ ctx }) => {
    const languagesService = new LanguagesService(ctx.supabase);
    return languagesService.getAllLanguages();
  }),
}); 