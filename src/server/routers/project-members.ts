import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { DI_TOKENS } from "@/lib/di/registry";
import { IProjectMembersService } from "@/lib/di/interfaces/service.interfaces";

export const projectMembersRouter = router({
  getMembers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      // Permission: must be a member
      const role = await service.getUserProjectRole(
        input.projectId,
        ctx.user.id
      );

      if (!role) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

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
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      // Only owner can invite
      const role = await service.getUserProjectRole(
        input.projectId,
        ctx.user.id
      );

      if (role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

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
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      // Only owner can change roles
      const role = await service.getUserProjectRole(
        input.projectId,
        ctx.user.id
      );

      if (role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

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
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      // Only owner can remove
      const role = await service.getUserProjectRole(
        input.projectId,
        ctx.user.id
      );

      if (role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await service.removeMember(input.projectId, input.userId);
    }),

  getInvitations: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      // Must be a member
      const role = await service.getUserProjectRole(
        input.projectId,
        ctx.user.id
      );

      if (!role) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await service.getProjectInvitations(input.projectId);
    }),

  acceptInvitation: publicProcedure
    .input(z.object({ token: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // For public procedures, you may need to create a container instance or use a static one
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
    .mutation(async ({ ctx, input }) => {
      const service = ctx.container.resolve<IProjectMembersService>(
        DI_TOKENS.PROJECT_MEMBERS_SERVICE
      );

      // Only owner can cancel
      const role = await service.getUserProjectRole(
        input.projectId,
        ctx.user.id
      );

      if (role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await service.cancelInvitation(input.invitationId);
    }),
});
