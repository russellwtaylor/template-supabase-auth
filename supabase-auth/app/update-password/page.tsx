import { updatePassword } from "@/app/actions";
import { redirect } from "next/navigation";
import AuthCard from "@/app/components/ui/auth-card";
import { ErrorAlert } from "@/app/components/ui/alert";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; error?: string }>;
}) {
  const { verified, error } = await searchParams;

  if (!verified) {
    redirect("/login");
  }

  return (
    <AuthCard>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Update your password
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter your new password below
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
            placeholder="At least 6 characters"
          />
        </div>

        <button
          formAction={updatePassword}
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Update password
        </button>
      </form>

      {error && <ErrorAlert>{error}</ErrorAlert>}
    </AuthCard>
  );
}
