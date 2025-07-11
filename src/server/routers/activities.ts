import { protectedProcedure, router } from "../trpc";
import { IProjectsService } from "@/lib/di/interfaces/service.interfaces";
import { DI_TOKENS } from "@/lib/di/registry";

export const activitiesRouter = router({
  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const projectsService = ctx.container.resolve<IProjectsService>(
      DI_TOKENS.PROJECTS_SERVICE
    );

    return await projectsService.getRecentActivity(ctx.user.id);
  }),
});
