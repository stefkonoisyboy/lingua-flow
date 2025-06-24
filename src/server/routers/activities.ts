import { protectedProcedure, router } from '../trpc';
import { ProjectsService } from '../../lib/services/projects.service';

export const activitiesRouter = router({
  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const projectsService = new ProjectsService(ctx.supabase);
    return projectsService.getRecentActivity(ctx.user.id);
  }),
}); 