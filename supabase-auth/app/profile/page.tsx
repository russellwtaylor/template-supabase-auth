import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
	updateProfile,
	updateEmail,
	updatePhone,
	sendPasswordReset,
} from "@/app/actions";
import AvatarUpload from "@/app/components/avatar-upload";

interface ProfilePageProps {
	searchParams: Promise<{
		error?: string;
		message?: string;
		nameError?: string;
		emailError?: string;
		phoneError?: string;
	}>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	// Upsert to handle existing users who don't have a profile row yet
	await supabase
		.from("profiles")
		.upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });

	const { data: profile } = await supabase
		.from("profiles")
		.select("full_name, avatar_url, phone")
		.eq("id", user.id)
		.single();

	const { data: factors } = await supabase.auth.mfa.listFactors();
	const totpEnabled = factors?.totp?.some((f) => f.status === "verified") ?? false;

	const { error, message, nameError, emailError, phoneError } = await searchParams;

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
			<div className="w-full max-w-sm space-y-8 px-4">
				<div className="text-center">
					<h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
						Profile
					</h1>
					<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
						{user.email}
					</p>
				</div>

				{error && (
					<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
						{decodeURIComponent(error)}
					</div>
				)}

				{message && (
					<div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
						{decodeURIComponent(message)}
					</div>
				)}

				{/* Avatar */}
				<div className="flex flex-col items-center gap-2">
					<AvatarUpload
						currentUrl={profile?.avatar_url ?? null}
						userId={user.id}
					/>
				</div>

				{/* Display Name */}
				<div className="space-y-3">
					<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						Display name
					</h2>
					<form className="space-y-3">
						<div className="space-y-1">
							<input
								id="full_name"
								name="full_name"
								type="text"
								defaultValue={profile?.full_name ?? ""}
								placeholder="Your name"
								maxLength={100}
								aria-describedby={nameError ? "name-error" : undefined}
								aria-invalid={!!nameError}
								className={`block w-full rounded-md border px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 bg-white dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 ${
									nameError
										? "border-red-400 focus:border-red-400 focus:ring-red-400 dark:border-red-600 dark:focus:border-red-500 dark:focus:ring-red-500"
										: "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
								}`}
							/>
							{nameError && (
								<p id="name-error" className="text-xs text-red-600 dark:text-red-400">
									{decodeURIComponent(nameError)}
								</p>
							)}
						</div>
						<button
							formAction={updateProfile}
							className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
						>
							Save changes
						</button>
					</form>
				</div>

				{/* Email */}
				<div className="space-y-3">
					<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						Email address
					</h2>
					<form className="space-y-3">
						<div className="space-y-1">
							<input
								id="email"
								name="email"
								type="email"
								defaultValue={user.email ?? ""}
								placeholder="you@example.com"
								aria-describedby={emailError ? "email-error" : undefined}
								aria-invalid={!!emailError}
								className={`block w-full rounded-md border px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 bg-white dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 ${
									emailError
										? "border-red-400 focus:border-red-400 focus:ring-red-400 dark:border-red-600 dark:focus:border-red-500 dark:focus:ring-red-500"
										: "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
								}`}
							/>
							{emailError && (
								<p id="email-error" className="text-xs text-red-600 dark:text-red-400">
									{decodeURIComponent(emailError)}
								</p>
							)}
						</div>
						<button
							formAction={updateEmail}
							className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
						>
							Update email
						</button>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">
							You&apos;ll receive a confirmation email at your new
							address.
						</p>
					</form>
				</div>

				{/* Phone */}
				<div className="space-y-3">
					<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						Phone number
					</h2>
					<form className="space-y-3">
						<div className="space-y-1">
							<input
								id="phone"
								name="phone"
								type="tel"
								defaultValue={profile?.phone ?? ""}
								placeholder="+1 555 000 0000"
								aria-describedby={phoneError ? "phone-error" : undefined}
								aria-invalid={!!phoneError}
								className={`block w-full rounded-md border px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 bg-white dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 ${
									phoneError
										? "border-red-400 focus:border-red-400 focus:ring-red-400 dark:border-red-600 dark:focus:border-red-500 dark:focus:ring-red-500"
										: "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
								}`}
							/>
							{phoneError && (
								<p id="phone-error" className="text-xs text-red-600 dark:text-red-400">
									{decodeURIComponent(phoneError)}
								</p>
							)}
						</div>
						<button
							formAction={updatePhone}
							className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
						>
							Save phone number
						</button>
					</form>
				</div>

				{/* Two-factor authentication */}
			<div className="space-y-3">
				<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
					Two-factor authentication
				</h2>
				<a
					href="/profile/totp"
					className="flex items-center justify-between rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
				>
					<span className="text-zinc-700 dark:text-zinc-300">
						Authenticator app
					</span>
					<span
						className={
							totpEnabled
								? "font-medium text-green-600 dark:text-green-400"
								: "text-zinc-400 dark:text-zinc-500"
						}
					>
						{totpEnabled ? "Enabled" : "Off"} →
					</span>
				</a>
			</div>

			{/* Password */}
				<div className="space-y-3">
					<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						Password
					</h2>
					<form>
						<button
							formAction={sendPasswordReset}
							className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
						>
							Send password reset link
						</button>
					</form>
				</div>

				<div className="border-t border-zinc-200 pt-4 text-center dark:border-zinc-800">
					<a
						href="/dashboard"
						className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
					>
						← Back to dashboard
					</a>
				</div>
			</div>
		</div>
	);
}
