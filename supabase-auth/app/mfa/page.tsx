import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MfaChallenge from "@/app/components/mfa-challenge";
import AuthCard from "@/app/components/ui/auth-card";

interface MfaPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function MfaPage({ searchParams }: MfaPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: aalData } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  // Already at AAL2 — no need to verify
  if (aalData?.currentLevel === "aal2") {
    redirect("/dashboard");
  }

  const { next } = await searchParams;

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Two-factor authentication
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>
      <MfaChallenge next={next} />
    </AuthCard>
  );
}
