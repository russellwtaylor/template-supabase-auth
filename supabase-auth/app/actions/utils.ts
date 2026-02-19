import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_DISPLAY_NAME_LENGTH = 100;
const PHONE_DIGITS_MIN = 7;
const PHONE_DIGITS_MAX = 15;

export function isValidEmail(email: string): boolean {
	return EMAIL_RE.test(email);
}

export function isValidPassword(password: string): boolean {
	return password.length >= MIN_PASSWORD_LENGTH;
}

export function isValidDisplayName(name: string): boolean {
	return name.length <= MAX_DISPLAY_NAME_LENGTH;
}

export function isValidPhone(digits: string): boolean {
	return (
		digits.length >= PHONE_DIGITS_MIN && digits.length <= PHONE_DIGITS_MAX
	);
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

interface AuthContext {
	supabase: SupabaseClient;
	user: User;
}

export async function requireAuth(redirectTo = "/login"): Promise<AuthContext> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect(redirectTo);
	}

	return { supabase, user };
}

// ---------------------------------------------------------------------------
// Error‑mapping helpers
// ---------------------------------------------------------------------------

type ErrorMap = Array<[pattern: string, message: string]>;

export function mapSupabaseError(
	error: { message: string },
	fallback: string,
	map: ErrorMap,
): string {
	for (const [pattern, message] of map) {
		if (error.message.includes(pattern)) return message;
	}
	return fallback;
}

// ---------------------------------------------------------------------------
// Redirect helpers
// ---------------------------------------------------------------------------

export function redirectWithError(
	path: string,
	param: string,
	message: string,
): never {
	redirect(`${path}?${param}=${encodeURIComponent(message)}`);
}

export function redirectWithMessage(path: string, message: string): never {
	redirect(`${path}?message=${encodeURIComponent(message)}`);
}

/**
 * Re‑throw errors thrown by Next.js `redirect()` so the framework can perform
 * the navigation. `redirect()` throws internally; catching it without
 * re‑throwing swallows the redirect.
 */
export function rethrowIfRedirect(err: unknown): void {
	if (
		typeof err === "object" &&
		err !== null &&
		"digest" in err &&
		typeof (err as { digest: string }).digest === "string" &&
		(err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
	) {
		throw err;
	}
}
