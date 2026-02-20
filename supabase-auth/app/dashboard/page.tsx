import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/actions";
import AuthCard from "@/app/components/ui/auth-card";

export default async function DashboardPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<AuthCard>
			<div className="space-y-6 text-center">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
						Dashboard
					</h1>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						Signed in as{" "}
						<span className="font-medium text-zinc-900 dark:text-zinc-50">
							{user.email}
						</span>
					</p>
				</div>
				<div className="flex flex-col items-center gap-3">
					<Link
						href="/profile"
						className="block w-full rounded-md border border-zinc-300 px-4 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
					>
						Edit profile
					</Link>
					<form className="w-full">
						<button
							formAction={signout}
							className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
						>
							Sign out
						</button>
					</form>
				</div>
			</div>
		</AuthCard>
	);
}
