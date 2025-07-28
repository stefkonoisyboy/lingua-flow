import { TRPCError } from "@trpc/server";
import { DI_TOKENS } from "@/lib/di/registry";
import { IProjectMembersService } from "@/lib/di/interfaces/service.interfaces";
import { t } from "../trpc";

// Usage: requireProjectPermission("owner") or requireProjectPermission(["owner", "translator"])
export function requireProjectPermission(
  required:
    | "owner"
    | "translator"
    | "viewer"
    | Array<"owner" | "translator" | "viewer">
) {
  return t.middleware(async ({ ctx, next, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Expect input to have projectId or project_id
    const { projectId, project_id } = (input ?? {}) as {
      projectId?: string;
      project_id?: string;
    };

    const project = projectId || project_id;

    if (!project) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Missing projectId",
      });
    }

    const service = ctx.container.resolve<IProjectMembersService>(
      DI_TOKENS.PROJECT_MEMBERS_SERVICE
    );

    const role = await service.getUserProjectRole(project, ctx.user.id);

    const requiredRoles = Array.isArray(required) ? required : [required];

    if (!role || !requiredRoles.includes(role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return next();
  });
}
