import { createClient } from "@/lib/supabase/server";
import AuthCard from "@/app/components/ui/auth-card";

export default async function Home() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<AuthCard>
			<div className="space-y-6 text-center">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
						Supabase Auth + Next.js
					</h1>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						A minimal boilerplate with email/password authentication
					</p>
				</div>
				<div className="flex flex-col gap-3">
					{user ? (
						<a
							href="/dashboard"
							className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
						>
							Go to Dashboard
						</a>
					) : (
						<>
							<a
								href="/login"
								className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
							>
								Log in
							</a>
							<a
								href="/signup"
								className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
							>
								Sign up
							</a>
						</>
					)}
				</div>
			</div>
		</AuthCard>
	);
}
