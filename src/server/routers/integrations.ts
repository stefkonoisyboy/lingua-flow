import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  IIntegrationsService,
  IGitHubTokensService,
} from "@/lib/di/interfaces/service.interfaces";
import { DI_TOKENS } from "@/lib/di/registry";
import { GitHubService } from "@/lib/services/github.service";
import { requireProjectPermission } from "../middleware/requireProjectPermission";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;

export const integrationsRouter = router({
  getProjectIntegration: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .use(requireProjectPermission(["owner"]))
    .query(async ({ ctx, input }) => {
      const integrationsService = ctx.container.resolve<IIntegrationsService>(
        DI_TOKENS.INTEGRATIONS_SERVICE
      );

      return await integrationsService.getProjectIntegration(input.projectId);
    }),

  updateIntegrationStatus: protectedProcedure
    .input(
      z.object({
        integrationId: z.string(),
        isConnected: z.boolean(),
        projectId: z.string(),
      })
    )
    .use(requireProjectPermission("owner"))
    .mutation(async ({ ctx, input }) => {
      const integrationsService = ctx.container.resolve<IIntegrationsService>(
        DI_TOKENS.INTEGRATIONS_SERVICE
      );

      return await integrationsService.updateIntegrationStatus(
        input.integrationId,
        input.isConnected
      );
    }),

  checkGitHubConnection: protectedProcedure.query(async ({ ctx }) => {
    const githubTokensService = ctx.container.resolve<IGitHubTokensService>(
      DI_TOKENS.GITHUB_TOKENS_SERVICE
    );

    const accessToken = await githubTokensService.getAccessToken(ctx.user.id);

    return { isConnected: Boolean(accessToken) };
  }),

  getGitHubAuthUrl: protectedProcedure.query(() => {
    const state = Math.random().toString(36).substring(7);

    return {
      url: `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${state}`,
      state,
    };
  }),

  listRepositories: protectedProcedure.query(async ({ ctx }) => {
    const integrationsService = ctx.container.resolve<IIntegrationsService>(
      DI_TOKENS.INTEGRATIONS_SERVICE
    );

    const githubTokensService = ctx.container.resolve<IGitHubTokensService>(
      DI_TOKENS.GITHUB_TOKENS_SERVICE
    );

    const accessToken = await githubTokensService.getAccessToken(ctx.user.id);

    if (!accessToken) {
      throw new Error("GitHub not connected");
    }

    return await integrationsService.listRepositories(accessToken);
  }),

  listBranches: protectedProcedure
    .input(z.object({ repository: z.string() }))
    .query(async ({ ctx, input }) => {
      const integrationsService = ctx.container.resolve<IIntegrationsService>(
        DI_TOKENS.INTEGRATIONS_SERVICE
      );

      const githubTokensService = ctx.container.resolve<IGitHubTokensService>(
        DI_TOKENS.GITHUB_TOKENS_SERVICE
      );

      const accessToken = await githubTokensService.getAccessToken(ctx.user.id);

      if (!accessToken) {
        throw new Error("GitHub not connected");
      }

      const [owner, repo] = input.repository.split("/");
      return await integrationsService.listBranches(accessToken, owner, repo);
    }),

  findTranslationFiles: protectedProcedure
    .input(
      z.object({
        repository: z.string(),
        branch: z.string(),
        filePattern: z.string().optional(),
        translationPath: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const githubTokensService = ctx.container.resolve<IGitHubTokensService>(
        DI_TOKENS.GITHUB_TOKENS_SERVICE
      );

      const accessToken = await githubTokensService.getAccessToken(ctx.user.id);

      if (!accessToken) {
        throw new Error("GitHub not connected");
      }

      const githubService = new GitHubService(accessToken);

      // Construct the file pattern with the translation path if provided
      const fullPattern = input.translationPath
        ? `${input.translationPath}/${
            input.filePattern || "*.{json,yaml,yml,po}"
          }`
        : input.filePattern;

      return await githubService.findTranslationFiles(
        input.repository,
        input.branch,
        fullPattern
      );
    }),

  importTranslations: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        repository: z.string(),
        branch: z.string(),
        files: z.array(
          z.object({
            path: z.string(),
            name: z.string(),
            type: z.string(),
          })
        ),
      })
    )
    .use(requireProjectPermission("owner"))
    .mutation(async ({ ctx, input }) => {
      const integrationsService = ctx.container.resolve<IIntegrationsService>(
        DI_TOKENS.INTEGRATIONS_SERVICE
      );

      const githubTokensService = ctx.container.resolve<IGitHubTokensService>(
        DI_TOKENS.GITHUB_TOKENS_SERVICE
      );

      const accessToken = await githubTokensService.getAccessToken(ctx.user.id);

      if (!accessToken) {
        throw new Error("GitHub not connected");
      }

      return await integrationsService.importProjectTranslations(
        input.projectId,
        accessToken,
        input.repository,
        input.branch,
        input.files,
        ctx.user.id
      );
    }),

  createGitHubIntegration: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        config: z.object({
          repository: z.string(),
          branch: z.string(),
          translationPath: z.string().optional(),
          filePattern: z.string().optional(),
        }),
      })
    )
    .use(requireProjectPermission("owner"))
    .mutation(async ({ ctx, input }) => {
      const integrationsService = ctx.container.resolve<IIntegrationsService>(
        DI_TOKENS.INTEGRATIONS_SERVICE
      );

      return await integrationsService.createGitHubIntegration(
        input.projectId,
        input.config
      );
    }),

  exportTranslations: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        repository: z.string(),
        baseBranch: z.string(),
        languageId: z.string().optional(),
      })
    )
    .use(requireProjectPermission("owner"))
    .mutation(async ({ ctx, input }) => {
      const integrationsService = ctx.container.resolve<IIntegrationsService>(
        DI_TOKENS.INTEGRATIONS_SERVICE
      );

      const githubTokensService = ctx.container.resolve<IGitHubTokensService>(
        DI_TOKENS.GITHUB_TOKENS_SERVICE
      );

      const accessToken = await githubTokensService.getAccessToken(ctx.user.id);

      if (!accessToken) {
        throw new Error("GitHub not connected");
      }

      return await integrationsService.exportTranslations(
        input.projectId,
        accessToken,
        input.repository,
        input.baseBranch,
        input.languageId
      );
    }),

  // Add: Pull and detect conflicts
  pullAndDetectConflicts: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        integrationId: z.string(),
        repository: z.string(),
        branch: z.string(),
      })
    )
    .use(requireProjectPermission("owner"))
    .mutation(async ({ ctx, input }) => {
      const integrationsService = ctx.container.resolve<IIntegrationsService>(
        DI_TOKENS.INTEGRATIONS_SERVICE
      );

      const githubTokensService = ctx.container.resolve<IGitHubTokensService>(
        DI_TOKENS.GITHUB_TOKENS_SERVICE
      );

      const accessToken = await githubTokensService.getAccessToken(ctx.user.id);

      if (!accessToken) {
        throw new Error("GitHub not connected");
      }

      return await integrationsService.pullAndDetectConflicts(
        input.projectId,
        accessToken,
        input.repository,
        input.branch
      );
    }),

  // Add: Resolve conflicts
  resolveConflicts: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        resolutions: z.array(
          z.object({
            languageId: z.string(),
            resolutions: z.array(
              z.object({
                key: z.string(),
                resolvedValue: z.string(),
              })
            ),
          })
        ),
      })
    )
    .use(requireProjectPermission("owner"))
    .mutation(async ({ ctx, input }) => {
      const integrationsService = ctx.container.resolve<IIntegrationsService>(
        DI_TOKENS.INTEGRATIONS_SERVICE
      );

      return await integrationsService.resolveAllTranslationConflicts(
        input.projectId,
        ctx.user.id,
        input.resolutions
      );
    }),
});
