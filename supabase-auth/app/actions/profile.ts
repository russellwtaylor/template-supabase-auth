"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
	isValidEmail,
	isValidDisplayName,
	isValidPhone,
	mapSupabaseError,
	redirectWithError,
	requireAuth,
	rethrowIfRedirect,
} from "./utils";

// ---------------------------------------------------------------------------
// Update display name
// ---------------------------------------------------------------------------

export async function updateProfile(formData: FormData) {
	try {
		const { supabase, user } = await requireAuth();

		const full_name = (formData.get("full_name") as string)?.trim() ?? "";

		if (!isValidDisplayName(full_name)) {
			redirectWithError(
				"/profile",
				"nameError",
				"Display name must be 100 characters or fewer",
			);
		}

		const { error } = await supabase.from("profiles").upsert({
			id: user.id,
			full_name,
			updated_at: new Date().toISOString(),
		});

		if (error) {
			console.error("Profile update error:", error);
			redirectWithError(
				"/profile",
				"nameError",
				"Could not update profile",
			);
		}

		redirect("/profile?message=Profile updated successfully");
	} catch (err) {
		rethrowIfRedirect(err);
		console.error("Unexpected error in updateProfile:", err);
		redirectWithError(
			"/profile",
			"nameError",
			"An unexpected error occurred. Please try again.",
		);
	}
}

// ---------------------------------------------------------------------------
// Update email
// ---------------------------------------------------------------------------

const EMAIL_UPDATE_ERROR_MAP: Array<[string, string]> = [
	["already registered", "This email address is already in use"],
	["already in use", "This email address is already in use"],
	["Email rate limit exceeded", "Too many requests. Please try again later."],
	["rate limit", "Too many requests. Please try again later."],
];

export async function updateEmail(formData: FormData) {
	try {
		const { supabase } = await requireAuth();

		const email = formData.get("email") as string;

		if (!email) {
			redirectWithError("/profile", "emailError", "Email is required");
		}

		if (!isValidEmail(email)) {
			redirectWithError(
				"/profile",
				"emailError",
				"Please enter a valid email address",
			);
		}

		const { error } = await supabase.auth.updateUser({ email });

		if (error) {
			console.error("Email update error:", error);
			const message = mapSupabaseError(
				error,
				"Could not update email",
				EMAIL_UPDATE_ERROR_MAP,
			);
			redirectWithError("/profile", "emailError", message);
		}

		redirect(
			"/profile?message=Check your inbox to confirm your new email address",
		);
	} catch (err) {
		rethrowIfRedirect(err);
		console.error("Unexpected error in updateEmail:", err);
		redirectWithError(
			"/profile",
			"emailError",
			"An unexpected error occurred. Please try again.",
		);
	}
}

// ---------------------------------------------------------------------------
// Update avatar
// ---------------------------------------------------------------------------

export async function updateAvatar(avatarUrl: string) {
	const { supabase, user } = await requireAuth();

	const { error } = await supabase.from("profiles").upsert({
		id: user.id,
		avatar_url: avatarUrl,
		updated_at: new Date().toISOString(),
	});

	if (error) {
		console.error("Avatar update error:", error);
	}

	revalidatePath("/profile", "page");
}

// ---------------------------------------------------------------------------
// Update phone
// ---------------------------------------------------------------------------

export async function updatePhone(formData: FormData) {
	try {
		const { supabase, user } = await requireAuth();

		const raw = (formData.get("phone") as string)?.trim() ?? "";

		if (raw !== "") {
			const digits = raw.replace(/\D/g, "");
			if (!isValidPhone(digits)) {
				redirectWithError(
					"/profile",
					"phoneError",
					"Please enter a valid phone number (7\u201315 digits)",
				);
			}
		}

		const { error } = await supabase.from("profiles").upsert({
			id: user.id,
			phone: raw || null,
			updated_at: new Date().toISOString(),
		});

		if (error) {
			console.error("Phone update error:", error);
			redirectWithError(
				"/profile",
				"phoneError",
				"Could not update phone number",
			);
		}

		redirect("/profile?message=Phone number saved");
	} catch (err) {
		rethrowIfRedirect(err);
		console.error("Unexpected error in updatePhone:", err);
		redirectWithError(
			"/profile",
			"phoneError",
			"An unexpected error occurred. Please try again.",
		);
	}
}
