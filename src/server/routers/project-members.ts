import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { DI_TOKENS } from "@/lib/di/registry";
import { IProjectMembersService } from "@/lib/di/interfaces/service.interfaces";
import { requireProjectPermission } from "../middleware/requireProjectPermission";

export const projectMembersRouter = router({
  getMembers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .use(requireProjectPermission(["owner", "translator", "viewer"]))
    .query(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      return await service.getProjectMembers(input.projectId);
    }),

  inviteMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        email: z.string().email(),
        role: z.enum(["owner", "translator", "viewer"]),
      })
    )
    .use(requireProjectPermission("owner"))
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      // 7 days from now
      const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      return await service.createInvitation(
        input.projectId,
        ctx.user.id,
        input.email,
        input.role,
        expiresAt
      );
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        newRole: z.enum(["owner", "translator", "viewer"]),
      })
    )
    .use(requireProjectPermission("owner"))
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      return await service.updateMemberRole(
        input.projectId,
        input.userId,
        input.newRole
      );
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      })
    )
    .use(requireProjectPermission("owner"))
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      return await service.removeMember(input.projectId, input.userId);
    }),

  getInvitations: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .use(requireProjectPermission(["owner"]))
    .query(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      return await service.getProjectInvitations(input.projectId);
    }),

  acceptInvitation: publicProcedure
    .input(z.object({ token: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      return await service.acceptInvitation(input.token, input.userId);
    }),

  rejectInvitation: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      return await service.rejectInvitation(input.token);
    }),

  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string(), projectId: z.string() }))
    .use(requireProjectPermission("owner"))
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      return await service.cancelInvitation(input.invitationId);
    }),

  getUserProjectRole: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      const role = await service.getUserProjectRole(
        input.projectId,
        ctx.user.id
      );

      return { role };
    }),
});
