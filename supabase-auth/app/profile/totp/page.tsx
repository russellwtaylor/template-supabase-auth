import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TotpManager from "@/app/components/totp-manager";

export default async function TotpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totpFactor = factors?.totp?.find((f) => f.status === "verified") ?? null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div>
          <a
            href="/profile"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to profile
          </a>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Two-factor authentication
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Use an authenticator app for extra account security
          </p>
        </div>
        <TotpManager
          enrolled={!!totpFactor}
          factorId={totpFactor?.id ?? null}
        />
      </div>
    </div>
  );
}
