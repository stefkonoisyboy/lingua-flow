import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { ProjectsService } from "../../lib/services/projects.service";

const githubConfigSchema = z.object({
  repository: z.string().min(1, "Repository is required"),
  branch: z.string().min(1, "Branch is required"),
  translationPath: z.string().optional(),
  filePattern: z.string().optional(),
});

export const projectsRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const projectsService = new ProjectsService(ctx.supabase);
    return projectsService.getProjectStats(ctx.user.id);
  }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const projectsService = new ProjectsService(ctx.supabase);
    return projectsService.getProjects(ctx.user.id);
  }),

  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Project name is required"),
        description: z.string().optional(),
        defaultLanguageId: z.string().min(1, "Default language is required"),
        githubConfig: githubConfigSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const projectsService = new ProjectsService(ctx.supabase);

      const project = await projectsService.createProject(
        input.name,
        input.description,
        ctx.user.id,
        input.defaultLanguageId,
        input.githubConfig
      );

      return project;
    }),
});
