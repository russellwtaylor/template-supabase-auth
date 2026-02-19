"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirectWithError, requireAuth, rethrowIfRedirect } from "./utils";

export async function deleteAccount() {
	try {
		const { supabase, user } = await requireAuth();

		const adminClient = createAdminClient();
		const { error } = await adminClient.auth.admin.deleteUser(user.id);

		if (error) {
			console.error("Account deletion error:", error);
			redirectWithError(
				"/profile",
				"error",
				"Could not delete account. Please try again.",
			);
		}

		await supabase.auth.signOut();
		revalidatePath("/", "layout");
		redirect("/login?message=Your account has been permanently deleted.");
	} catch (err) {
		rethrowIfRedirect(err);
		console.error("Unexpected error in deleteAccount:", err);
		redirectWithError(
			"/profile",
			"error",
			"An unexpected error occurred. Please try again.",
		);
	}
}
