import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { DI_TOKENS } from "../../lib/di/registry";
import { IProjectsService } from "../../lib/di/interfaces/service.interfaces";

const githubConfigSchema = z.object({
  repository: z.string().min(1, "Repository is required"),
  branch: z.string().min(1, "Branch is required"),
  translationPath: z.string().optional(),
  filePattern: z.string().optional(),
});

export const projectsRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const projectsService = ctx.container.resolve<IProjectsService>(
      DI_TOKENS.PROJECTS_SERVICE
    );

    return projectsService.getProjectStats(ctx.user.id);
  }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const projectsService = ctx.container.resolve<IProjectsService>(
      DI_TOKENS.PROJECTS_SERVICE
    );

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
      const projectsService = ctx.container.resolve<IProjectsService>(
        DI_TOKENS.PROJECTS_SERVICE
      );

      const project = await projectsService.createProject(
        input.name,
        input.description,
        ctx.user.id,
        input.defaultLanguageId,
        input.githubConfig
      );

      return project;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const projectsService = ctx.container.resolve<IProjectsService>(
      DI_TOKENS.PROJECTS_SERVICE
    );

    return projectsService.getAll(ctx.user.id);
  }),

  deleteProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const projectsService = ctx.container.resolve<IProjectsService>(
        DI_TOKENS.PROJECTS_SERVICE
      );

      await projectsService.deleteProject(input.projectId);
    }),
});
