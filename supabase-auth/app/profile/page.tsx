import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
	updateProfile,
	updateEmail,
	updatePhone,
	sendPasswordReset,
} from "@/app/actions";
import AvatarUpload from "@/app/components/avatar-upload";
import AccountDeleteButton from "@/app/components/account-delete-button";
import { LinkGoogleButton } from "@/app/components/link-google-button";
import { ErrorAlert, SuccessAlert } from "@/app/components/ui/alert";

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

	// Fetch profile data and MFA factors in parallel
	const [{ data: profile }, { data: factors }] = await Promise.all([
		supabase
			.from("profiles")
			.select("full_name, avatar_url, phone")
			.eq("id", user.id)
			.single(),
		supabase.auth.mfa.listFactors(),
	]);

	const totpEnabled = factors?.totp?.some((f) => f.status === "verified") ?? false;

	const hasGoogleIdentity = user.identities?.some((i) => i.provider === "google") ?? false;
	const hasEmailIdentity = user.identities?.some((i) => i.provider === "email") ?? false;

	const { error, message, nameError, emailError, phoneError } =
		await searchParams;

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

				{error && <ErrorAlert>{error}</ErrorAlert>}
				{message && <SuccessAlert>{message}</SuccessAlert>}

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
								<p id="name-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
									{nameError}
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
								<p id="email-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
									{emailError}
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
								<p id="phone-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
									{phoneError}
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

				{/* Connected accounts */}
				<div className="space-y-3">
					<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						Connected accounts
					</h2>
					<div className="flex flex-col gap-2">
						{hasGoogleIdentity && (
							<div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
								<svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
									<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
									<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
									<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
									<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
								</svg>
								<span className="text-sm text-zinc-700 dark:text-zinc-300">Google</span>
								<span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">Connected</span>
							</div>
						)}
						{hasEmailIdentity && (
							<div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
								<svg className="h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
								</svg>
								<span className="text-sm text-zinc-700 dark:text-zinc-300">Email / password</span>
								<span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">Connected</span>
							</div>
						)}
						{!hasGoogleIdentity && <LinkGoogleButton />}
					</div>
				</div>

				{/* Password */}
				<div className="space-y-3">
					<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						Password
					</h2>
					{hasEmailIdentity ? (
						<form>
							<button
								formAction={sendPasswordReset}
								className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
							>
								Send password reset link
							</button>
						</form>
					) : (
						<div className="space-y-3">
							<p className="text-sm text-zinc-500 dark:text-zinc-400">
								Your account uses Google sign-in. You can set a password to also sign in with your email.
							</p>
							<form>
								<button
									formAction={sendPasswordReset}
									className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
								>
									Set a password via email
								</button>
							</form>
						</div>
					)}
				</div>

				{/* Danger zone */}
				<div className="space-y-3">
					<h2 className="text-sm font-medium text-red-600 dark:text-red-400">
						Danger zone
					</h2>
					<AccountDeleteButton />
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
