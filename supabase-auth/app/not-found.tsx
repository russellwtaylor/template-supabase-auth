import Link from "next/link";
import AuthCard from "@/app/components/ui/auth-card";

export default function NotFound() {
  return (
    <AuthCard>
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Page not found
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go home
        </Link>
      </div>
    </AuthCard>
  );
}
