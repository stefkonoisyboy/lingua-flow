import { z } from 'zod';
import { publicProcedure, router } from '@/server/trpc';
import { GitHubService } from '@/lib/services/github.service';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET!;

export const integrationsRouter = router({
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
      const response = await fetch("https://github.com/login/oauth/access_token", {
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
      });

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

    const { data: tokenData } = await supabase
      .from("github_tokens")
      .select("access_token")
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

      const { data: tokenData } = await supabase
        .from("github_tokens")
        .select("access_token")
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

      const { data: tokenData } = await supabase
        .from("github_tokens")
        .select("access_token")
        .single();

      if (!tokenData?.access_token) {
        throw new Error("GitHub not connected");
      }

      const githubService = new GitHubService(tokenData.access_token);
      return githubService.findTranslationFiles(
        input.repository,
        input.branch,
        input.filePattern
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

      const { data: tokenData } = await supabase
        .from("github_tokens")
        .select("access_token")
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
}); 