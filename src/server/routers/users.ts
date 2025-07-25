import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { DI_TOKENS } from "@/lib/di/registry";
import { IProjectMembersService } from "@/lib/di/interfaces/service.interfaces";

export const usersRouter = router({
  existsByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const projectMembersService =
        ctx.container.resolve<IProjectMembersService>(
          DI_TOKENS.PROJECT_MEMBERS_SERVICE
        );

      return await projectMembersService.findByEmail(input.email);
    }),
});
