"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CodeInput from "@/app/components/ui/code-input";
import { ErrorAlert } from "@/app/components/ui/alert";

interface MfaChallengeProps {
  next?: string;
}

export default function MfaChallenge({ next }: MfaChallengeProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((f) => f.status === "verified");

      if (!totpFactor) {
        // No verified factor found — shouldn't happen, but send to dashboard
        router.push("/dashboard");
        return;
      }

      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: totpFactor.id });

      if (challengeError || !challenge) {
        setError("Failed to create challenge. Please try again.");
        setLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) {
        setError("Invalid code. Check your authenticator app and try again.");
        setLoading(false);
        return;
      }

      router.push(next && next.startsWith("/") ? next : "/dashboard");
    } catch (err) {
      console.error("MFA challenge error:", err);
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorAlert>{error}</ErrorAlert>}
      <CodeInput value={code} onChange={setCode} autoFocus />
      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}
