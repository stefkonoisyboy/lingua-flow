import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { DI_TOKENS } from "../../lib/di/registry";
import { ISyncHistoryService } from "../../lib/di/interfaces/service.interfaces";
import { requireProjectPermission } from "../middleware/requireProjectPermission";

export const syncHistoryRouter = router({
  getByProjectId: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .use(requireProjectPermission(["owner", "translator", "viewer"]))
    .query(async ({ input, ctx }) => {
      const syncHistoryService = ctx.container.resolve<ISyncHistoryService>(
        DI_TOKENS.SYNC_HISTORY_SERVICE
      );
      return syncHistoryService.getByProjectId(input.projectId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        integrationId: z.string(),
        status: z.enum(["success", "failed"]),
        details: z.record(z.any()),
      })
    )
    .use(requireProjectPermission("owner"))
    .mutation(async ({ input, ctx }) => {
      const syncHistoryService = ctx.container.resolve<ISyncHistoryService>(
        DI_TOKENS.SYNC_HISTORY_SERVICE
      );

      await syncHistoryService.create(input);
    }),
});
