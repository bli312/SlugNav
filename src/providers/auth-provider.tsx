import type { Session } from "@supabase/supabase-js";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { getAuthRedirectUrl, openGoogleSignIn } from "@/lib/google-auth";
import { createOAuthCallbackHandler } from "@/lib/oauth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  completeSignIn: (url: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const messageOf = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Authentication failed. Please try again.";

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const operationInProgress = useRef(false);

  // Keep the single-use-code handler for this provider's lifetime.
  const [completeSignIn] = useState(() =>
    createOAuthCallbackHandler(getAuthRedirectUrl(), async (code) => {
      const { error: exchangeError } =
        await getSupabase().auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    }),
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // INITIAL_SESSION restores storage; later events cover login, refresh, and logout.
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function runAuthAction(action: () => Promise<void>) {
    if (operationInProgress.current) return;
    operationInProgress.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (authError) {
      setError(messageOf(authError));
    } finally {
      operationInProgress.current = false;
      setBusy(false);
    }
  }

  const signIn = () =>
    runAuthAction(async () => {
      const callbackUrl = await openGoogleSignIn();
      if (callbackUrl) await completeSignIn(callbackUrl);
    });

  const signOut = () =>
    runAuthAction(async () => {
      const { error: signOutError } = await getSupabase().auth.signOut({
        scope: "local",
      });
      if (signOutError) throw signOutError;
    });

  return (
    <AuthContext.Provider
      value={{ session, loading, busy, error, signIn, signOut, completeSignIn }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
