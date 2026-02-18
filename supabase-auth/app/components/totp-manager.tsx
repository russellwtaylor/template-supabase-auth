"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CodeInput from "@/app/components/ui/code-input";
import { ErrorAlert } from "@/app/components/ui/alert";

interface TotpManagerProps {
  enrolled: boolean;
  factorId: string | null;
}

interface EnrollData {
  factorId: string;
  qrCode: string;
  secret: string;
}

type Phase = "idle" | "scanning" | "disabling";

export default function TotpManager({ enrolled, factorId }: TotpManagerProps) {
  // Local state mirrors props so the UI can update immediately on success
  // without waiting for a full page navigation.
  const [isEnrolled, setIsEnrolled] = useState(enrolled);
  const [activeFactorId, setActiveFactorId] = useState(factorId);
  const [phase, setPhase] = useState<Phase>("idle");
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function resetCode() {
    setCode("");
    setError(null);
  }

  async function startEnroll() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });

    if (enrollError || !data) {
      setError(enrollError?.message ?? "Failed to start enrollment");
      setLoading(false);
      return;
    }

    setEnrollData({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
    setPhase("scanning");
    resetCode();
    setLoading(false);
  }

  async function verifyEnroll() {
    if (!enrollData) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: enrollData.factorId });

      if (challengeError || !challenge) {
        setError("Failed to create challenge. Please try again.");
        setLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) {
        setError("Invalid code. Please try again.");
        setLoading(false);
        return;
      }

      // Update local state immediately so the UI reflects enrollment
      // without needing a full page reload. router.refresh() syncs the
      // server component in the background.
      setIsEnrolled(true);
      setActiveFactorId(enrollData.factorId);
      setEnrollData(null);
      setPhase("idle");
      resetCode();
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error("MFA enroll verify error:", err);
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  }

  async function confirmDisable() {
    if (!activeFactorId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      // Verify the code first to reach AAL2, then unenroll
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: activeFactorId });

      if (challengeError || !challenge) {
        setError("Failed to create challenge. Please try again.");
        setLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: activeFactorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) {
        setError("Invalid code. Please try again.");
        setLoading(false);
        return;
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: activeFactorId,
      });

      if (unenrollError) {
        setError(unenrollError.message ?? "Failed to disable 2FA");
        setLoading(false);
        return;
      }

      setIsEnrolled(false);
      setActiveFactorId(null);
      setPhase("idle");
      resetCode();
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error("MFA disable error:", err);
      setError("Failed to disable 2FA. Please try again.");
      setLoading(false);
    }
  }

  // ── Not enrolled, idle ───────────────────────────────────────────────────
  if (!isEnrolled && phase === "idle") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Once enabled, you&apos;ll enter a 6-digit code from your authenticator
          app each time you sign in.
        </p>
        {error && <ErrorAlert>{error}</ErrorAlert>}
        <button
          onClick={startEnroll}
          disabled={loading}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Loading…" : "Enable two-factor authentication"}
        </button>
      </div>
    );
  }

  // ── Enrollment — scan QR + enter code ────────────────────────────────────
  if (phase === "scanning" && enrollData) {
    return (
      <div className="space-y-5">
        <ol className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <li>1. Open Google Authenticator, Authy, or any TOTP app</li>
          <li>2. Scan the QR code below</li>
          <li>3. Enter the 6-digit code to confirm</li>
        </ol>

        {/* QR code — always on white so scanners work in dark mode */}
        <div className="flex justify-center rounded-lg bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrollData.qrCode}
            alt="Authenticator QR code"
            className="h-48 w-48"
          />
        </div>

        <details>
          <summary className="cursor-pointer text-center text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
            Can&apos;t scan? Enter the setup key manually
          </summary>
          <p className="mt-2 break-all rounded bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {enrollData.secret}
          </p>
        </details>

        {error && <ErrorAlert>{error}</ErrorAlert>}

        <div className="space-y-3">
          <CodeInput value={code} onChange={setCode} autoFocus />
          <button
            onClick={verifyEnroll}
            disabled={loading || code.length !== 6}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Verifying…" : "Verify and enable"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase("idle");
              resetCode();
            }}
            className="w-full text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Enrolled, idle ───────────────────────────────────────────────────────
  if (isEnrolled && phase === "idle") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950">
          <svg
            className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Two-factor authentication is enabled
          </span>
        </div>
        {error && <ErrorAlert>{error}</ErrorAlert>}
        <button
          onClick={() => {
            setPhase("disabling");
            resetCode();
          }}
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Disable two-factor authentication
        </button>
      </div>
    );
  }

  // ── Disabling — confirm with code ────────────────────────────────────────
  if (phase === "disabling") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter the current code from your authenticator app to confirm.
        </p>
        {error && <ErrorAlert>{error}</ErrorAlert>}
        <CodeInput value={code} onChange={setCode} autoFocus />
        <button
          onClick={confirmDisable}
          disabled={loading || code.length !== 6}
          className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Disabling…" : "Confirm and disable 2FA"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPhase("idle");
            resetCode();
          }}
          className="w-full text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    );
  }

  return null;
}
