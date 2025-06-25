import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/types/database.types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=missing_params", request.url)
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
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

  try {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          client_secret: process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET,
          code,
          state,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error_description || "Failed to exchange code");
    }

    // Store the token in Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error: insertError } = await supabase.from("github_tokens").upsert(
      {
        id: user.id, // Using user.id as the primary key
        user_id: user.id,
        access_token: data.access_token,
      },
      { onConflict: "user_id" }
    );

    if (insertError) {
      console.error("Failed to store GitHub token:", insertError);
      throw new Error("Failed to store GitHub token");
    }

    return NextResponse.redirect(
      new URL("/dashboard?github=connected", request.url)
    );
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=github_auth_failed", request.url)
    );
  }
}
