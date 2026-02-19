import { requestPasswordReset } from "@/app/actions";
import AuthCard from "@/app/components/ui/auth-card";
import { ErrorAlert, SuccessAlert } from "@/app/components/ui/alert";

export default async function ForgotPasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string; message?: string }>;
}) {
	const { error, message } = await searchParams;

	return (
		<AuthCard>
			<div className="space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
					Reset your password
				</h1>
				<p className="text-sm text-zinc-500 dark:text-zinc-400">
					Enter your email and we&apos;ll send you a reset link
				</p>
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

				<button
					formAction={requestPasswordReset}
					className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
				>
					Send reset link
				</button>
			</form>

			{error && <ErrorAlert>{error}</ErrorAlert>}
			{message && <SuccessAlert>{message}</SuccessAlert>}

			<p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
				Remember your password?{" "}
				<a
					href="/login"
					className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
				>
					Log in
				</a>
			</p>
		</AuthCard>
	);
}
