import { updatePassword } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PasswordFields from "@/app/components/password-fields";
import AuthCard from "@/app/components/ui/auth-card";
import { ErrorAlert } from "@/app/components/ui/alert";

export default async function UpdatePasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ verified?: string; error?: string }>;
}) {
	const { verified, error } = await searchParams;

	if (verified !== "true") {
		redirect("/login");
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login?error=Session expired. Please request a new password reset link.");
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
				<PasswordFields label="New Password" autoFocus />

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
