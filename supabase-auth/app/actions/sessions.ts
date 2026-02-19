"use server";

import { redirect } from "next/navigation";
import { redirectWithError, requireAuth, rethrowIfRedirect } from "./utils";

// ---------------------------------------------------------------------------
// Revoke a single session
// ---------------------------------------------------------------------------

export async function revokeSession(sessionId: string) {
	try {
		const { supabase } = await requireAuth();

		const { error } = await supabase.rpc("delete_user_session", {
			session_id: sessionId,
		});

		if (error) {
			console.error("Session revocation error:", error);
			redirectWithError(
				"/profile/sessions",
				"error",
				"Could not revoke session. Please try again.",
			);
		}

		redirect("/profile/sessions?message=Session revoked successfully");
	} catch (err) {
		rethrowIfRedirect(err);
		console.error("Unexpected error in revokeSession:", err);
		redirectWithError(
			"/profile/sessions",
			"error",
			"An unexpected error occurred. Please try again.",
		);
	}
}

// ---------------------------------------------------------------------------
// Revoke all other sessions
// ---------------------------------------------------------------------------

export async function revokeOtherSessions() {
	try {
		const { supabase } = await requireAuth();

		const { error } = await supabase.auth.signOut({ scope: "others" });

		if (error) {
			console.error("Sign out others error:", error);
			redirectWithError(
				"/profile/sessions",
				"error",
				"Could not sign out other sessions. Please try again.",
			);
		}

		redirect("/profile/sessions?message=Signed out of all other sessions");
	} catch (err) {
		rethrowIfRedirect(err);
		console.error("Unexpected error in revokeOtherSessions:", err);
		redirectWithError(
			"/profile/sessions",
			"error",
			"An unexpected error occurred. Please try again.",
		);
	}
}
