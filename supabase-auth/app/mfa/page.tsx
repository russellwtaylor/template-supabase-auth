import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MfaChallenge from "@/app/components/mfa-challenge";

export default async function MfaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  // Already at AAL2 — no need to verify
  if (aalData?.currentLevel === "aal2") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Two-factor authentication
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
        <MfaChallenge />
      </div>
    </div>
  );
}
