import { login } from "@/app/actions";
import { GoogleAuthButton } from "@/app/components/google-auth-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Log in
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter your email and password to sign in
          </p>
        </div>

        <GoogleAuthButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-300 dark:border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-50 px-2 text-zinc-500 dark:bg-black dark:text-zinc-400">
              Or continue with
            </span>
          </div>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
              placeholder="Your password"
            />
          </div>

          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
            >
              Forgot password?
            </a>
          </div>

          <button
            formAction={login}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Log in
          </button>
        </form>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md bg-green-50 p-3 text-center text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
            {message}
          </p>
        )}

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
