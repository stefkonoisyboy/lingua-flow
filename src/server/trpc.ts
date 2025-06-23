import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { createClient } from '@/lib/supabase/server';
import { ZodError } from 'zod';

export const createTRPCContext = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    user,
    supabase,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure for authenticated routes
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
}); 