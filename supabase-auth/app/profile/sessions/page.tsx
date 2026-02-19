import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SessionList, { type Session } from "@/app/components/session-list";
import AuthCard from "@/app/components/ui/auth-card";
import { ErrorAlert, SuccessAlert } from "@/app/components/ui/alert";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: sessions }, { data: sessionData }] = await Promise.all([
    supabase.rpc("get_user_sessions"),
    supabase.auth.getSession(),
  ]);

  const currentSessionId = sessionData?.session?.access_token
    ? (() => {
        try {
          const payload = JSON.parse(
            Buffer.from(sessionData.session!.access_token.split(".")[1], "base64url").toString()
          ) as { sid?: string };
          return payload.sid ?? null;
        } catch {
          return null;
        }
      })()
    : null;

  const { error, message } = await searchParams;

  return (
    <AuthCard>
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
          Active sessions
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Manage where you&apos;re signed in
        </p>
      </div>

      {message && <SuccessAlert>{message}</SuccessAlert>}
      {error && <ErrorAlert>{error}</ErrorAlert>}

      {sessions && sessions.length > 0 ? (
        <SessionList
          sessions={sessions as Session[]}
          currentSessionId={currentSessionId}
        />
      ) : (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          No active sessions found.
        </p>
      )}
    </AuthCard>
  );
}
