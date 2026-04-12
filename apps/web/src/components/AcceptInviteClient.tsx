"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, LogIn, UserPlus } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";
import Image from "next/image";


type State =
  | { phase: "loading" }
  | { phase: "accepting" }
  | { phase: "success"; orgId: string; role: string }
  | { phase: "error"; message: string }
  | { phase: "unauthenticated" }; // token is valid but user isn't logged in

export default function AcceptInvitePage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const { cloud } = useApi();
  const token = params.get("token") ?? "";

  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    if (!isLoaded) return;

    if (!token) {
      setState({ phase: "error", message: "Missing invite token. Check the link in your email." });
      return;
    }

    if (!isSignedIn) {
      // Not authenticated — we can't accept yet. Show sign-in / sign-up options
      // and preserve the token so they land back here after auth.
      setState({ phase: "unauthenticated" });
      return;
    }

    // Authenticated — try to accept.
    setState({ phase: "accepting" });

    (async () => {
      try {
        const authToken = await getToken();
        if (!authToken) throw new Error("Could not get session token.");

        const res = await cloud.acceptInvite(authToken, token);
        setState({ phase: "success", orgId: res.org_id, role: res.role });

        // Redirect to dashboard after short pause.
        setTimeout(() => router.push("/dashboard"), 2500);
      } catch (err: any) {
        // Map known server errors to friendlier messages.
        const msg: string = err?.message ?? "Failed to accept invite.";
        if (msg.toLowerCase().includes("already a member")) {
          setState({ phase: "error", message: "You're already a member of this organization." });
        } else if (msg.toLowerCase().includes("expired")) {
          setState({ phase: "error", message: "This invite has expired. Ask the organization admin to send a new one." });
        } else if (msg.toLowerCase().includes("accepted")) {
          setState({ phase: "error", message: "This invite link has already been used." });
        } else if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("revoked")) {
          setState({ phase: "error", message: "This invite is no longer valid. It may have been revoked." });
        } else {
          setState({ phase: "error", message: msg });
        }
      }
    })();
  }, [isLoaded, isSignedIn, token]);

  // Build sign-in / sign-up URLs that redirect back here after auth.
  const returnPath = `/invite/accept?token=${encodeURIComponent(token)}`;
  const signInURL = `/sign-in?redirect_url=${encodeURIComponent(returnPath)}`;
  const signUpURL = `/sign-up?redirect_url=${encodeURIComponent(returnPath)}`;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl text-center">
        {/* Logo */}
        <Image
          src="/logo-squircle.png"
          alt="vaultkey"
          width={24}
          height={24}
        />

        {state.phase === "loading" && (
          <LoadingView label="Checking invite…" />
        )}

        {state.phase === "accepting" && (
          <LoadingView label="Accepting invitation…" />
        )}

        {state.phase === "success" && (
          <SuccessView role={state.role} />
        )}

        {state.phase === "error" && (
          <ErrorView message={state.message} />
        )}

        {state.phase === "unauthenticated" && (
          <UnauthenticatedView
            signInURL={signInURL}
            signUpURL={signUpURL}
          />
        )}
      </div>
    </main>
  );
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function LoadingView({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function SuccessView({ role }: { role: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <CheckCircle className="h-12 w-12 text-green-500" />
      <div>
        <h1 className="text-lg font-semibold text-foreground">You're in!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          You've joined as a <strong className="text-foreground capitalize">{role}</strong>.
          Redirecting to your dashboard…
        </p>
      </div>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <XCircle className="h-12 w-12 text-red-500" />
      <div>
        <h1 className="text-lg font-semibold text-foreground">Invite unavailable</h1>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
      <Link
        href="/dashboard"
        className="mt-2 text-sm text-primary hover:underline"
      >
        Go to dashboard →
      </Link>
    </div>
  );
}

function UnauthenticatedView({
  signInURL,
  signUpURL,
}: {
  signInURL: string;
  signUpURL: string;
}) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Accept your invitation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to your existing account, or create a new one to join the organization.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <Link
          href={signInURL}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm py-2.5 px-4 hover:bg-primary/90 transition-colors"
        >
          <LogIn className="h-4 w-4" />
          Sign in to accept
        </Link>
        <Link
          href={signUpURL}
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background text-foreground font-medium text-sm py-2.5 px-4 hover:bg-accent transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Create account &amp; accept
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Already part of this org?{" "}
        <Link href="/dashboard" className="text-primary hover:underline">
          Go to dashboard
        </Link>
      </p>
    </div>
  );
}