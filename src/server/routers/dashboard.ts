import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { DashboardService } from '../../lib/services/dashboard.service';

export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const dashboardService = new DashboardService(ctx.supabase);
    return dashboardService.getProjectStats(ctx.user.id);
  }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const dashboardService = new DashboardService(ctx.supabase);
    return dashboardService.getProjects(ctx.user.id);
  }),

  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const dashboardService = new DashboardService(ctx.supabase);
    return dashboardService.getRecentActivity(ctx.user.id);
  }),

  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Project name is required'),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dashboardService = new DashboardService(ctx.supabase);
      await dashboardService.createProject(input.name, input.description, ctx.user.id);
    }),
});