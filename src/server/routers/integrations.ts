import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { GitHubService } from "../../lib/services/github.service";
import { IntegrationsService } from "../../lib/services/integrations.service";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;

export const integrationsRouter = router({
  checkGitHubConnection: publicProcedure.query(async () => {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { isConnected: false };
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from("github_tokens")
      .select("access_token")
      .eq("user_id", user.id)
      .single();

    if (tokenError) {
      throw new Error("Failed to fetch token data for current user");
    }

    return { isConnected: Boolean(tokenData?.access_token) };
  }),

  getGitHubAuthUrl: publicProcedure.query(() => {
    const state = Math.random().toString(36).substring(7);
    return {
      url: `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${state}`,
      state,
    };
  }),

  exchangeGitHubCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code: input.code,
            state: input.state,
          }),
        }
      );

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error_description || "Failed to exchange code");
      }

      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set({ name, value, ...options })
              );
            },
          },
        }
      );

      // Store the token in Supabase
      await supabase.from("github_tokens").upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        access_token: data.access_token,
      });

      return { success: true };
    }),

  listRepositories: publicProcedure.query(async () => {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data: tokenData } = await supabase
      .from("github_tokens")
      .select("access_token")
      .eq("user_id", user.id)
      .single();

    if (!tokenData?.access_token) {
      throw new Error("GitHub not connected");
    }

    const githubService = new GitHubService(tokenData.access_token);
    return githubService.listRepositories();
  }),

  listBranches: publicProcedure
    .input(
      z.object({
        repository: z.string(),
      })
    )
    .query(async ({ input }) => {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set({ name, value, ...options })
              );
            },
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: tokenData } = await supabase
        .from("github_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .single();

      if (!tokenData?.access_token) {
        throw new Error("GitHub not connected");
      }

      const githubService = new GitHubService(tokenData.access_token);
      return githubService.listBranches(input.repository);
    }),

  findTranslationFiles: publicProcedure
    .input(
      z.object({
        repository: z.string(),
        branch: z.string(),
        filePattern: z.string().optional(),
        translationPath: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set({ name, value, ...options })
              );
            },
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: tokenData } = await supabase
        .from("github_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .single();

      if (!tokenData?.access_token) {
        throw new Error("GitHub not connected");
      }

      const githubService = new GitHubService(tokenData.access_token);

      // Construct the file pattern with the translation path if provided
      const fullPattern = input.translationPath
        ? `${input.translationPath}/${
            input.filePattern || "*.{json,yaml,yml,po}"
          }`
        : input.filePattern;

      return githubService.findTranslationFiles(
        input.repository,
        input.branch,
        fullPattern
      );
    }),

  getFileContent: publicProcedure
    .input(
      z.object({
        repository: z.string(),
        path: z.string(),
        branch: z.string(),
      })
    )
    .query(async ({ input }) => {
      const cookieStore = await cookies();

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set({ name, value, ...options })
              );
            },
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: tokenData } = await supabase
        .from("github_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .single();

      if (!tokenData?.access_token) {
        throw new Error("GitHub not connected");
      }

      const githubService = new GitHubService(tokenData.access_token);

      return githubService.getFileContent(
        input.repository,
        input.path,
        input.branch
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
    .mutation(async ({ ctx, input }) => {
      const { data: tokenData } = await ctx.supabase
        .from("github_tokens")
        .select("access_token")
        .eq("user_id", ctx.user.id)
        .single();

      if (!tokenData?.access_token) {
        throw new Error("GitHub not connected");
      }

      const integrationsService = new IntegrationsService(ctx.supabase);
      await integrationsService.importProjectTranslations(
        input.projectId,
        tokenData.access_token,
        input.repository,
        input.branch,
        input.files
      );
    }),
});
