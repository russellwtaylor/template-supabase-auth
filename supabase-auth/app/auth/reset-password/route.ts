import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const token_hash = searchParams.get("token_hash");
	const type = searchParams.get("type");
	const code = searchParams.get("code");

	console.log("Reset password route - Received params:", {
		hasTokenHash: !!token_hash,
		hasType: !!type,
		hasCode: !!code,
		type,
	});

	const supabase = await createClient();

	// Handle PKCE flow (code parameter)
	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error("Code exchange error:", error);
			redirect("/login?error=Invalid or expired reset link");
		}

		console.log("Code exchanged successfully");
		redirect("/update-password?verified=true");
	}

	// Handle token hash flow (token_hash + type parameters)
	if (token_hash && type) {
		// Sign out any existing session first to prevent conflicts with OTP verification.
		// This is especially important for OAuth-only users (e.g. Google sign-in) who are
		// setting a password for the first time — the active OAuth session can cause verifyOtp
		// to fail, and without a clean recovery session Supabase won't add the email identity
		// when the password is updated.
		await supabase.auth.signOut();

		const { error } = await supabase.auth.verifyOtp({
			token_hash,
			type: type as EmailOtpType,
		});

		if (error) {
			console.error("Token verification error:", error);
			redirect("/login?error=Invalid or expired reset link");
		}

		console.log("Token verified successfully");
		redirect("/update-password?verified=true");
	}

	// If no parameters, check if there's already an active session
	// (this happens when using {{ .ConfirmationURL }} in email template)
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (session) {
		console.log("Active session found, redirecting to update-password");
		redirect("/update-password?verified=true");
	}

	console.error("No valid authentication method found");
	redirect("/login?error=Invalid reset link");
}
