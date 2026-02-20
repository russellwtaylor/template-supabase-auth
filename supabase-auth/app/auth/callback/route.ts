import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/app/actions/utils";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const code = searchParams.get("code");
	const next = safeRedirectPath(searchParams.get("next"));

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error("OAuth callback error:", error);
			const params = new URLSearchParams({
				error: "Authentication failed. Please try again.",
			});
			return NextResponse.redirect(
				`${request.nextUrl.origin}/login?${params}`,
			);
		}

		return NextResponse.redirect(`${request.nextUrl.origin}${next}`);
	}

	const params = new URLSearchParams({
		error: "Authentication failed. Please try again.",
	});
	return NextResponse.redirect(
		`${request.nextUrl.origin}/login?${params}`,
	);
}
