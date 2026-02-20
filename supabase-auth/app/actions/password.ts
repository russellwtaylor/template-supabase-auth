"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
	MIN_PASSWORD_LENGTH,
	isValidEmail,
	isValidPassword,
	mapSupabaseError,
	redirectWithError,
	requireAuth,
	rethrowIfRedirect,
} from "./utils";

// ---------------------------------------------------------------------------
// Request password reset (unauthenticated — from /forgot-password)
// ---------------------------------------------------------------------------

const RESET_REQUEST_ERROR_MAP: Array<[string, string]> = [
	[
		"Email rate limit exceeded",
		"Too many requests. Please try again in a few minutes.",
	],
	["Invalid email", "Please enter a valid email address."],
	["not authorized", "Email service not configured. Please contact support."],
];

export async function requestPasswordReset(formData: FormData) {
	const supabase = await createClient();
	const email = formData.get("email") as string;

	if (!email) {
		redirectWithError("/forgot-password", "error", "Email is required");
	}

	if (!isValidEmail(email)) {
		redirectWithError(
			"/forgot-password",
			"error",
			"Please enter a valid email address",
		);
	}

	if (!process.env.NEXT_PUBLIC_SITE_URL) {
		console.error("NEXT_PUBLIC_SITE_URL is not configured");
		redirectWithError(
			"/forgot-password",
			"error",
			"Server configuration error. Please contact support.",
		);
	}

	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
	});

	if (error) {
		console.error("Password reset error:", error);
		const message = mapSupabaseError(
			error,
			"Could not send password reset email",
			RESET_REQUEST_ERROR_MAP,
		);
		redirectWithError("/forgot-password", "error", message);
	}

	revalidatePath("/forgot-password", "page");
	redirect(
		"/forgot-password?message=Check your email for a password reset link",
	);
}

// ---------------------------------------------------------------------------
// Send password reset (authenticated — from /profile)
// ---------------------------------------------------------------------------

export async function sendPasswordReset() {
	try {
		const { supabase, user } = await requireAuth();

		if (!process.env.NEXT_PUBLIC_SITE_URL) {
			console.error("NEXT_PUBLIC_SITE_URL is not configured");
			redirectWithError(
				"/profile",
				"error",
				"Server configuration error. Please contact support.",
			);
		}

		if (!user.email) {
			redirectWithError(
				"/profile",
				"error",
				"No email address associated with this account.",
			);
		}

		const { error } = await supabase.auth.resetPasswordForEmail(
			user.email,
			{
				redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
			},
		);

		if (error) {
			console.error("Password reset error:", error);
			const message = mapSupabaseError(
				error,
				"Could not send password reset email",
				[
					[
						"Email rate limit exceeded",
						"Too many requests. Please try again in a few minutes.",
					],
					[
						"rate limit",
						"Too many requests. Please try again in a few minutes.",
					],
				],
			);
			redirectWithError("/profile", "error", message);
		}

		redirect(
			"/profile?message=Password reset link sent. Check your email.",
		);
	} catch (err) {
		rethrowIfRedirect(err);
		console.error("Unexpected error in sendPasswordReset:", err);
		redirectWithError(
			"/profile",
			"error",
			"An unexpected error occurred. Please try again.",
		);
	}
}

// ---------------------------------------------------------------------------
// Update password (from reset‑password flow)
// ---------------------------------------------------------------------------

const PASSWORD_UPDATE_ERROR_MAP: Array<[string, string]> = [
	[
		"Password should be at least",
		`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
	],
	[
		"not authenticated",
		"Session expired. Please request a new password reset link.",
	],
];

export async function updatePassword(formData: FormData) {
	const supabase = await createClient();
	const password = formData.get("password") as string;
	const confirmPassword = formData.get("confirmPassword") as string;

	if (!password) {
		redirectWithError("/update-password", "error", "Password is required");
	}

	if (!isValidPassword(password)) {
		redirectWithError(
			"/update-password",
			"error",
			`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
		);
	}

	if (password !== confirmPassword) {
		redirectWithError(
			"/update-password",
			"error",
			"Passwords do not match",
		);
	}

	const { error } = await supabase.auth.updateUser({ password });

	if (error) {
		console.error("Password update error:", error);
		const message = mapSupabaseError(
			error,
			"Could not update password",
			PASSWORD_UPDATE_ERROR_MAP,
		);
		redirectWithError("/update-password", "error", message);
	}

	// Sign out ALL active sessions after a password change so that any
	// compromised session (e.g. the one that triggered the reset) is
	// immediately invalidated on every device.
	await supabase.auth.signOut({ scope: "global" });
	revalidatePath("/", "layout");
	redirect(
		"/login?message=Password updated successfully. Please sign in with your new password.",
	);
}
