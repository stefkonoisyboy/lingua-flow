"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthError, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  AUTH_ERROR_CODES,
  AUTH_MESSAGES,
  HTTP_STATUS,
} from "@/lib/constants/auth";

export type AuthErrorMessage = {
  message: string;
  type: "error" | "warning" | "info";
};

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthErrorMessage | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleAuthError = (error: AuthError): AuthErrorMessage => {
    switch (error.status) {
      case HTTP_STATUS.BAD_REQUEST:
        switch (error.code) {
          case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
            return {
              message: AUTH_MESSAGES.INVALID_CREDENTIALS,
              type: "error",
            };
          case AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED:
            return {
              message: AUTH_MESSAGES.EMAIL_NOT_CONFIRMED,
              type: "warning",
            };
          case AUTH_ERROR_CODES.USER_ALREADY_EXISTS:
            return {
              message: AUTH_MESSAGES.USER_ALREADY_EXISTS,
              type: "error",
            };
          case AUTH_ERROR_CODES.WEAK_PASSWORD:
            return {
              message: AUTH_MESSAGES.WEAK_PASSWORD,
              type: "error",
            };
          default:
            return {
              message: AUTH_MESSAGES.INVALID_REQUEST,
              type: "error",
            };
        }
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        return {
          message: AUTH_MESSAGES.UNPROCESSABLE_ENTITY,
          type: "error",
        };
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        return {
          message: AUTH_MESSAGES.TOO_MANY_REQUESTS,
          type: "warning",
        };
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return {
          message: AUTH_MESSAGES.INTERNAL_SERVER_ERROR,
          type: "error",
        };
      case HTTP_STATUS.UNAUTHORIZED:
        return {
          message: AUTH_MESSAGES.SESSION_EXPIRED,
          type: "warning",
        };
      default:
        return {
          message: AUTH_MESSAGES.UNEXPECTED_ERROR,
          type: "error",
        };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push("/dashboard");

      return { success: true };
    } catch (error) {
      if (error instanceof AuthError) {
        const errorMessage = handleAuthError(error);
        setError(errorMessage);

        return { error: errorMessage };
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Check if user data exists and user is not identityData
      if (!data.user || data.user.identities?.length === 0) {
        setError({
          message: AUTH_MESSAGES.USER_ALREADY_EXISTS,
          type: "error",
        });
        return;
      }

      return {
        message: AUTH_MESSAGES.SIGNUP_SUCCESS,
        type: "info" as const,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        setError(handleAuthError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    email: string
  ): Promise<AuthErrorMessage | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;

      return {
        message: AUTH_MESSAGES.RESET_PASSWORD_SUCCESS,
        type: "info" as const,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        setError(handleAuthError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.push("/sign-in");
    } catch (error) {
      if (error instanceof AuthError) {
        setError(handleAuthError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    loading,
    error,
    user,
  };
};
