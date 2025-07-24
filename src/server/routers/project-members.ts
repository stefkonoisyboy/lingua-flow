import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { DI_TOKENS } from "@/lib/di/registry";
import { IProjectMembersService } from "@/lib/di/interfaces/service.interfaces";
import { requireProjectPermission } from "../middleware/requireProjectPermission";

export const projectMembersRouter = router({
  getMembers: protectedProcedure
    .use(requireProjectPermission(["owner", "translator", "viewer"]))
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );
      return await service.getProjectMembers(input.projectId);
    }),

  inviteMember: protectedProcedure
    .use(requireProjectPermission("owner"))
    .input(
      z.object({
        projectId: z.string(),
        email: z.string().email(),
        role: z.enum(["owner", "translator", "viewer"]),
      })
    )
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
    .use(requireProjectPermission("owner"))
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        newRole: z.enum(["owner", "translator", "viewer"]),
      })
    )
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
    .use(requireProjectPermission("owner"))
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );
      return await service.removeMember(input.projectId, input.userId);
    }),

  getInvitations: protectedProcedure
    .use(requireProjectPermission(["owner", "translator", "viewer"]))
    .input(z.object({ projectId: z.string() }))
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
    .use(requireProjectPermission("owner"))
    .input(z.object({ invitationId: z.string(), projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );
      return await service.cancelInvitation(input.invitationId);
    }),
});
